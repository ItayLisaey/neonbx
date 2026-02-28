import { Command } from "commander";
import { initCommand } from "./commands/init.ts";
import { showConfig, setConfigCommand, resetConfig } from "./commands/config.ts";
import { listCommand } from "./commands/list.ts";
import { currentCommand } from "./commands/current.ts";
import { switchCommand } from "./commands/switch.ts";
import { syncCommand } from "./commands/sync.ts";

const program = new Command();

program
  .name("neonbx")
  .description("Neon Database Branch Navigator CLI")
  .version("0.1.0");

program
  .command("init")
  .description("Interactive setup wizard (re-runnable)")
  .action(initCommand);

const configCmd = program
  .command("config")
  .description("Manage neonbx configuration");

configCmd
  .command("show")
  .description("Display current configuration")
  .action(showConfig);

configCmd
  .command("set <key> <value>")
  .description("Set a configuration value")
  .action(setConfigCommand);

configCmd
  .command("reset")
  .description("Clear all configuration")
  .action(resetConfig);

program
  .command("list")
  .description("List all Neon branches")
  .action(listCommand);

program
  .command("current")
  .description("Show which branch the current DB URL points to")
  .action(currentCommand);

program
  .command("switch [branch]")
  .description("Switch to a different branch")
  .action(switchCommand);

program
  .command("sync")
  .description("Auto-switch to the Neon branch matching current git branch")
  .action(syncCommand);

program.parse();
