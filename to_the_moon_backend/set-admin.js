const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setAdmin() {
  try {
    const result = await prisma.users.update({
      where: { email: 'wjddms2767@naver.com' },
      data: { is_admin: true },
    });

    console.log('✅ 관리자 권한이 부여되었습니다:');
    console.log('이메일:', result.email);
    console.log('이름:', result.name);
    console.log('역할:', result.role);
    console.log('관리자:', result.is_admin);
  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setAdmin();
