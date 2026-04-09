import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import DocumentDetails from './pages/DocumentDetails';
import CreateContract from './pages/CreateContract';
import SignDocument from './pages/SignDocument';
import Settings from './pages/Settings';
import { UserProfile } from './types';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Profile fetch error:', error);
        if (error.code === 'PGRST116') {
          console.log('Profile not found, attempting to create...');
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([{ id: userId, email: session?.user.email, plan: 'free', docs_this_month: 0 }])
            .select()
            .single();
          
          if (createError) {
            console.error('Error creating profile (User might be deleted):', createError);
            // If we can't even create a profile, the user probably doesn't exist in Auth anymore
            await supabase.auth.signOut();
            setSession(null);
            setProfile(null);
          } else {
            setProfile(newProfile);
          }
        } else {
          // Other errors (like network or schema cache)
          console.error('Critical profile fetch error:', error.message);
        }
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Unexpected error in fetchProfile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing profile={profile} />} />
        <Route 
          path="/auth" 
          element={session ? <Navigate to="/dashboard" /> : <Auth />} 
        />
        <Route 
          path="/dashboard" 
          element={session ? <Dashboard profile={profile} /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/document/:id" 
          element={session ? <DocumentDetails profile={profile} /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/create-contract" 
          element={session ? <CreateContract profile={profile} /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/sign/:id" 
          element={session ? <SignDocument profile={profile} /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/settings" 
          element={session ? <Settings profile={profile} /> : <Navigate to="/auth" />} 
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
