import { spawn } from "node:child_process";

const commands = [
  ["server", "npm", ["run", "dev:server"]],
  ["client", "npm", ["run", "dev:client"]]
];

const children = commands.map(([name, command, args]) => {
  const child = spawn(command, args, { stdio: "pipe", shell: false });

  child.stdout.on("data", (chunk) => process.stdout.write(`[${name}] ${chunk}`));
  child.stderr.on("data", (chunk) => process.stderr.write(`[${name}] ${chunk}`));
  child.on("exit", (code) => {
    if (code && code !== 0) {
      process.exitCode = code;
      children.forEach((other) => {
        if (other !== child) other.kill("SIGTERM");
      });
    }
  });

  return child;
});

const shutdown = () => {
  children.forEach((child) => child.kill("SIGTERM"));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
