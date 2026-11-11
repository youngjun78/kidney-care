import NextAuth, { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import KakaoProvider from 'next-auth/providers/kakao';

const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID || '',
      clientSecret: process.env.KAKAO_CLIENT_SECRET || '',
      profile(profile) {
        // 카카오 고유 ID(숫자)를 기반으로 영구 불변 고유 식별자 확정
        const kakaoUserId = String(profile.id);
        const kakaoEmail = profile.kakao_account?.email || `kakao_${kakaoUserId}@kidney.care`;
        return {
          id: kakaoUserId,
          name: profile.properties?.nickname || profile.kakao_account?.profile?.nickname || '카카오 사용자',
          email: kakaoEmail,
          image: profile.properties?.profile_image || profile.kakao_account?.profile?.profile_image_url || null,
        };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user, account, profile }: any) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      if (account?.provider === 'kakao' && profile?.id) {
        token.id = String(profile.id);
        if (!token.email) {
          token.email = `kakao_${profile.id}@kidney.care`;
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session?.user) {
        session.user.id = token.id || token.sub;
        if (!session.user.email && token.email) {
          session.user.email = token.email;
        }
        if (!session.user.email && session.user.id) {
          session.user.email = `kakao_${session.user.id}@kidney.care`;
        }
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
