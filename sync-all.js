#!/usr/bin/env node
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('🚀 开始完整同步流程...\n');

async function runCommand(command, description) {
  console.log(`\n📌 ${description}...`);
  console.log(`   命令: ${command}\n`);

  try {
    const { stdout, stderr } = await execAsync(command);

    if (stdout) {
      console.log(stdout);
    }

    if (stderr) {
      console.error('⚠️  警告:', stderr);
    }

    console.log(`✅ ${description}完成\n`);
    return true;
  } catch (error) {
    console.error(`❌ ${description}失败:`);
    console.error(error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    return false;
  }
}

async function main() {
  const steps = [
    {
      command: 'node notion-sync.js',
      description: '步骤1: 同步Notion导航数据'
    },
    {
      command: 'node create-nested-pages.js',
      description: '步骤2: 创建多级页面文件'
    }
  ];

  let successCount = 0;

  for (const step of steps) {
    const success = await runCommand(step.command, step.description);
    if (success) {
      successCount++;
    } else {
      console.log('\n⚠️  部分步骤失败，但继续执行...\n');
    }
  }

  console.log('\n' + '='.repeat(50));
  if (successCount === steps.length) {
    console.log('🎉 全部同步完成！');
    console.log(`✅ ${successCount}/${steps.length} 个步骤成功`);
  } else {
    console.log(`⚠️  同步完成，但有 ${steps.length - successCount} 个步骤失败`);
    console.log(`✅ ${successCount}/${steps.length} 个步骤成功`);
  }
  console.log('='.repeat(50) + '\n');

  console.log('💡 下一步:');
  console.log('   运行 npm run docs:dev 启动开发服务器');
  console.log('   或运行 npm run docs:build 构建生产版本\n');
}

main().catch(error => {
  console.error('❌ 同步流程失败:', error);
  process.exit(1);
});
