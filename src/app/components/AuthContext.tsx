// =====================================================================
// AUTH CONTEXT remove the console.log
// lines later once things are confirmed working.
// =====================================================================
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../../lib/supabaseClient';

export interface User {
 id: string;
 name: string;
 email: string;
 role: 'admin' | 'alumni' | 'faculty' | 'representative';
 registrationStatus?: 'pending' | 'approved' | 'rejected';
 department?: string;
 batchYear?: number;
 program?: string;
 profileImage?: string;
 assignedBatchYear?: number;
 assignedDepartment?: string;
 assignedProgram?: string;
 phone?: string;
 address?: string;
 studentId?: string;
 graduationDate?: string;
 currentCompany?: string;
 currentPosition?: string;
 username?: string;   // admin accounts
 position?: string;   // faculty accounts (job title, distinct from alumni's currentPosition)
}

// Fields on `profiles` that a signed-in user is allowed to update about
// themselves (name/role/registration_status etc. are intentionally excluded).
export interface ProfileUpdate {
 name?: string;
 phone?: string;
 address?: string;
 profileImage?: string;
 department?: string;
 batchYear?: number;
 program?: string;
 currentCompany?: string;
 currentPosition?: string;
 username?: string;
 position?: string;
}

export interface RegistrationData {
 firstName: string;
 lastName: string;
 email: string;
 password: string;
 phone: string;
 studentId: string;
 department: string;
 program: string;
 batchYear: number;
 profileImage?: string;
}

interface AuthContextType {
 user: User | null;
 loading: boolean;
 login: (email: string, password: string) => Promise<'success' | 'invalid' | 'pending' | 'rejected'>;
 logout: () => void;
 register: (data: RegistrationData) => Promise<boolean>;
 updateProfile: (patch: ProfileUpdate) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapProfileToUser(profile: any): User {
 return {
   id: profile.id,
   name: profile.name,
   email: profile.email,
   role: profile.role,
   registrationStatus: profile.registration_status ?? undefined,
   department: profile.department ?? undefined,
   batchYear: profile.batch_year ?? undefined,
   program: profile.program ?? undefined,
   profileImage: profile.profile_image ?? undefined,
   assignedBatchYear: profile.assigned_batch_year ?? undefined,
   assignedDepartment: profile.assigned_department ?? undefined,
   assignedProgram: profile.assigned_program ?? undefined,
   phone: profile.phone ?? undefined,
   address: profile.address ?? undefined,
   studentId: profile.student_id ?? undefined,
   graduationDate: profile.graduation_date ?? undefined,
   currentCompany: profile.current_company ?? undefined,
   currentPosition: profile.current_position ?? undefined,
   username: profile.username ?? undefined,
   position: profile.position ?? undefined,
 };
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
 return Promise.race([
   promise,
   new Promise<T>((_, reject) =>
     setTimeout(() => reject(new Error(`[timeout] ${label} took longer than ${ms}ms`)), ms)
   ),
 ]);
}

async function fetchProfile(userId: string): Promise<User | null> {
 console.log('[auth] fetchProfile: starting for', userId);
 try {
   const { data, error } = await withTimeout(
     supabase.from('profiles').select('*').eq('id', userId).single(),
     10000,
     'fetchProfile query'
   );
   console.log('[auth] fetchProfile: result', { data, error });
   if (error || !data) return null;
   return mapProfileToUser(data);
 } catch (err) {
   console.error('[auth] fetchProfile: threw', err);
   return null;
 }
}

export function AuthProvider({ children }: { children: ReactNode }) {
 const [user, setUser] = useState<User | null>(null);
 const [loading, setLoading] = useState(true);

 // Mirrors `user` so the async auth-state handler below can check "do we
 // already have this person loaded" without depending on (and re-running
 // for) every `user` change.
 const userRef = React.useRef<User | null>(null);
 useEffect(() => { userRef.current = user; }, [user]);

 useEffect(() => {
   let active = true;
   console.log('[auth] AuthProvider mounted, checking existing session...');

   // Shared by the initial getSession() check and every subsequent
   // onAuthStateChange firing (SIGNED_IN, TOKEN_REFRESHED, etc).
   //
   // Supabase silently rotates the access token every few minutes for as
   // long as the app is open — tab focused or not — which fires
   // TOKEN_REFRESHED here. That event doesn't mean anything about the
   // profile changed, so there's no need to re-fetch it if we already
   // have this same user loaded. This also avoids the bug that was
   // logging people out: a slow/failed profile fetch (network hiccup,
   // a background tab's throttled request hitting the 10s timeout) was
   // being treated identically to "no session" and forcing a sign-out,
   // even though the Supabase session itself was still perfectly valid.
   const syncSession = async (event: string, session: { user: { id: string } } | null) => {
     if (session?.user) {
       if (event === 'TOKEN_REFRESHED' && userRef.current?.id === session.user.id) {
         return;
       }
       const profile = await fetchProfile(session.user.id);
       // Rejected accounts are blocked entirely. Pending accounts DO get
       // signed in — they just get a restricted view (see AlumniDashboard),
       // so alumni can check on/act on their own status instead of being
       // stuck outside the app.
       if (profile && profile.registrationStatus === 'rejected') {
         await supabase.auth.signOut();
         if (active) setUser(null);
       } else if (profile) {
         if (active) setUser(profile);
       } else if (userRef.current?.id !== session.user.id) {
         // No profile came back and it's not just a hiccup on a session
         // we already trust (different/no user loaded) — treat as
         // genuinely signed out.
         if (active) setUser(null);
       } else {
         console.warn('[auth] fetchProfile failed on', event, '— keeping existing session instead of logging out');
       }
     } else {
       if (active) setUser(null);
     }
   };

   supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('[auth] getSession result', session);
      if (!active) return;
      await syncSession('INITIAL_SESSION', session);
      if (active) setLoading(false);
    }).catch(err => {
      console.error('[auth] getSession threw', err);
      if (active) setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[auth] onAuthStateChange fired', event, session);
      if (!active) return;
      await syncSession(event, session);
    });
   return () => {
     active = false;
     listener.subscription.unsubscribe();
   };
 }, []);

 const login = async (email: string, password: string): Promise<'success' | 'invalid' | 'pending' | 'rejected'> => {
   console.log('[auth] login: starting for', email);
   try {
     const { data, error } = await withTimeout(
       supabase.auth.signInWithPassword({ email, password }),
       10000,
       'signInWithPassword'
     );
     console.log('[auth] login: signInWithPassword result', { data, error });
     if (error || !data.user) return 'invalid';

     const profile = await fetchProfile(data.user.id);
    console.log('[auth] login: profile', profile);
    if (!profile) return 'invalid';

    // Rejected accounts still can't get in at all. Pending accounts DO
    // sign in now — they just land on a restricted view of the app (see
    // AlumniDashboard) instead of being bounced back out.
    if (profile.registrationStatus === 'rejected') {
      console.log('[auth] login: blocked, registrationStatus is rejected');
      await supabase.auth.signOut();
      setUser(null);
      return 'rejected';
    }

    setUser(profile);
    console.log('[auth] login: success, user set, registrationStatus is', profile.registrationStatus);
    return profile.registrationStatus === 'pending' ? 'pending' : 'success';

   } catch (err) {
     console.error('[auth] login: threw', err);
     return 'invalid';
   }
 };

 const logout = () => {
   supabase.auth.signOut();
   setUser(null);
 };

 const updateProfile = async (patch: ProfileUpdate): Promise<boolean> => {
   if (!user) return false;
   const dbPatch: Record<string, unknown> = {};
   if (patch.name !== undefined) dbPatch.name = patch.name;
   if (patch.phone !== undefined) dbPatch.phone = patch.phone;
   if (patch.address !== undefined) dbPatch.address = patch.address;
   if (patch.profileImage !== undefined) dbPatch.profile_image = patch.profileImage;
   if (patch.department !== undefined) dbPatch.department = patch.department;
   if (patch.batchYear !== undefined) dbPatch.batch_year = patch.batchYear;
   if (patch.program !== undefined) dbPatch.program = patch.program;
   if (patch.currentCompany !== undefined) dbPatch.current_company = patch.currentCompany;
   if (patch.currentPosition !== undefined) dbPatch.current_position = patch.currentPosition;
   if (patch.username !== undefined) dbPatch.username = patch.username;
   if (patch.position !== undefined) dbPatch.position = patch.position;

   const { error } = await supabase.from('profiles').update(dbPatch).eq('id', user.id);
   if (error) {
     console.error('[auth] updateProfile: failed', error);
     return false;
   }
   setUser({ ...user, ...patch } as User);
   return true;
 };

 const register = async (data: RegistrationData): Promise<boolean> => {
   console.log('[auth] register: starting for', data.email);
   try {
     const { data: signUpData, error: signUpError } = await withTimeout(
       supabase.auth.signUp({
         email: data.email,
         password: data.password,
         options: {
           data: {
             name: `${data.firstName} ${data.lastName}`,
             student_id: data.studentId,
             department: data.department,
             batch_year: data.batchYear,
             program: data.program,
             profile_image:
               data.profileImage ||
               `https://ui-avatars.com/api/?name=${data.firstName}+${data.lastName}&background=0ea5e9&color=fff`,
           },
         },
       }),
       10000,
       'signUp'
     );
     console.log('[auth] register: signUp result', { signUpData, signUpError });
     if (signUpError || !signUpData.user) return false;
     return true;
   } catch (err) {
     console.error('[auth] register: threw', err);
     return false;
   }
 };

 return (
   <AuthContext.Provider value={{ user, loading, login, logout, register, updateProfile }}>
     {children}
   </AuthContext.Provider>
 );
}

export function useAuth() {
 const context = useContext(AuthContext);
 if (context === undefined) {
   throw new Error('useAuth must be used within an AuthProvider');
 }
 return context;
}