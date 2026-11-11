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
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account, user }: any) {
      // 카카오 최초 로그인 시 고유 account.providerAccountId를 토큰에 확실하게 저장
      if (account?.provider === 'kakao' && account.providerAccountId) {
        token.kakaoId = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session?.user) {
        session.user.id = token.sub;
        // 카카오 로그인 시 이메일이 없거나 동의 안 되었으면 kakaoId 기반 불변 이메일 부여
        if (!session.user.email) {
          const uniqueId = token.kakaoId || token.sub;
          if (uniqueId) {
            session.user.email = `kakao_${uniqueId}@kidney.care`;
          }
        }
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
