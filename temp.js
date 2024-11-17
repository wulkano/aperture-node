import { execSync } from 'node:child_process';

let pid = process.pid;

const getParentPid = (pid) => {
  return execSync(`ps -p ${pid} -o ppid=`).toString().trim();
}

const getCommand = (pid) => {
  return execSync(`ps -p ${pid} -o command=`).toString().trim();
}

while(true) {
  const parent = getParentPid(pid);

  if (parent === '0' || parent === '1') {
    const command = getCommand(pid);
    console.log(`\nCommand: ${command}\n\n`);
    break;
  }

  console.log(`PID: ${pid}, Parent PID: ${parent}, Command: ${getCommand(pid)}\n`);

  pid = parent;
}