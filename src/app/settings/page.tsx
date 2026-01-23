'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { LogOut, User, Shield, Trash2, Mail, Camera, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export default function SettingsPage() {
  const { user, signOut, uploadAvatar, updateProfile } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const publicUrl = await uploadAvatar(file);
    
    if (publicUrl) {
        await updateProfile({ avatar_url: publicUrl });
    } else {
        alert('이미지 업로드에 실패했습니다.');
    }
    setIsUploading(false);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-pulse">
         <div className="h-8 w-32 bg-zinc-800 rounded"></div>
         <div className="h-40 bg-zinc-800 rounded"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight">설정</h2>
      </div>

      {/* 내 프로필 카드 */}
      <div className="rounded-sm border border-zinc-800 bg-zinc-900/50 p-6">
        <h3 className="text-sm font-medium text-zinc-400 mb-6 flex items-center gap-2">
          <User size={16} />
          내 프로필
        </h3>
        
        <div className="flex items-center gap-4">
          <div 
            className="relative h-16 w-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 group cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
             {user?.user_metadata?.avatar_url ? (
                 <img 
                    src={user.user_metadata.avatar_url} 
                    alt="Profile" 
                    className="h-full w-full rounded-full object-cover"
                 />
             ) : (
                 <div className="h-full w-full flex items-center justify-center text-white font-bold text-2xl">
                    {user?.user_metadata?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                 </div>
             )}
             
             {/* Upload Overlay */}
             <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {isUploading ? <Loader2 className="animate-spin text-white" size={20} /> : <Camera className="text-white" size={20} />}
             </div>
             <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
             />
          </div>
          <div>
            <p className="text-lg font-bold text-white">
              {user?.user_metadata?.display_name || '사용자'}
            </p>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-zinc-500">
               <span className="text-zinc-600">ID:</span>
               <span className="font-mono text-zinc-400">
                 {user?.user_metadata?.username || user?.email?.split('@')[0]}
               </span>
            </div>
            {/* 실제 이메일 (복구용) 표시 */}
            {user?.user_metadata?.recovery_email && (
                <p className="text-xs text-zinc-600 mt-1 flex items-center gap-1">
                    <Mail size={10} />
                    {user.user_metadata.recovery_email}
                </p>
            )}
          </div>
        </div>
      </div>

      {/* 계정 관리 */}
      <div className="space-y-4">
         <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
          <Shield size={16} />
          계정 관리
        </h3>
        
        <div className="rounded-sm border border-zinc-800 bg-zinc-900/30 divide-y divide-zinc-800 overflow-hidden">
            <form action="/auth/signout" method="post">
                <button 
                    type="submit"
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-900 transition-colors group"
                >
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-zinc-300 group-hover:text-white">로그아웃</span>
                        <span className="text-[10px] text-zinc-500">현재 기기에서 로그아웃합니다.</span>
                    </div>
                    <LogOut size={16} className="text-zinc-500 group-hover:text-white transition-colors" />
                </button>
            </form>
            
            <button 
                className="w-full flex items-center justify-between p-4 text-left hover:bg-red-900/10 transition-colors group"
                onClick={() => alert('데이터 보호를 위해 현재는 직접 탈퇴가 불가능합니다. 관리자에게 문의해주세요.')}
            >
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-zinc-300 group-hover:text-red-400">회원 탈퇴</span>
                    <span className="text-[10px] text-zinc-500">모든 데이터를 영구적으로 삭제합니다.</span>
                </div>
                <Trash2 size={16} className="text-zinc-500 group-hover:text-red-400 transition-colors" />
            </button>
        </div>
      </div>
      
      <div className="text-center pt-10 pb-4">
          <p className="text-xs font-mono text-zinc-700">Smart Kitchen Log v0.1.2</p>
      </div>
    </div>
  );
}