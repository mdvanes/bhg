/* eslint-disable no-process-exit */
/* eslint-disable unicorn/no-process-exit */
/* eslint-disable no-console */
import { Command, flags } from "@oclif/command";
import { option } from "@oclif/parser/lib/flags";
import chalk = require("chalk");
import { exec as origExec } from "child_process";
import { readFileSync } from "fs";
import { promisify } from "util";
const exec = promisify(origExec);

class Bhg extends Command {
  static description = "Azure toolkit";

  static flags = {
    // add --version flag to show CLI version
    version: flags.version({ char: "v" }),
    help: flags.help({ char: "h" }),
    // flag with a value (-n, --name=VALUE)
    name: flags.string({ char: "n", description: "name to print" }),
    // flag with no value (-f, --force)
    force: flags.boolean({ char: "f" }),
  };

  static args = [
    { name: "pcom", description: "pseudo command", options: ["ps"] }, // TODO convert to multi command
  ];

  async run() {
    const { args, flags } = this.parse(Bhg);

    const name = flags.name ?? "world";
    this.log(`hello ${name} from ./src/index.ts`);
    // if (args.file && flags.force) {
    //   this.log(`you input --force and --file: ${args.file}`)
    // }
    if (args.pcom === "ps") {
      this.log("try to ps remotely...");
      const OPTIONS_PATH = "~/.bhg/options.json";
      const INVALID_TENANT_ID = "INVALID_TENANT_ID";

      let tenantId = undefined;
      try {
        const optionsJson = readFileSync(OPTIONS_PATH);
        const options: Record<string, string> = JSON.parse(
          optionsJson.toString()
        );
        if (options.tenantId) {
          console.log(option);
          tenantId = options.tenantId;
        } else {
          throw new Error(INVALID_TENANT_ID);
        }
      } catch (error) {
        if((error as Error).message === INVALID_TENANT_ID) {
          console.error(
            `You should fill ${OPTIONS_PATH} with { "tenantId": "TENANT_ID" } where TENANT_ID is an ID that can be found on Azure Active Directory`
          );
          process.exit(0);
        }
        if ((error as any).code === "ENOENT") {
          console.error(
            `You should create a ${OPTIONS_PATH} containing { "tenantId": "TENANT_ID" } where TENANT_ID is an ID that can be found on Azure Active Directory`
          );
          process.exit(0);
        }
        throw error;
      }

      console.log(chalk.green(tenantId));

      // TODO docker login azure --tentant-id <my_tenant_id>
      // TODO docker context create cloudstudyAciContext
      // TODO docker context use cloudstudyAciContext
      // if this fails with "not found",
      // log: first create the cloudstudyAciContext.
      // If that fails, log: first login to azure with the tenant ID that can be found in portal.azure.com under Azure Active Directory

      const { stdout } = await exec("docker ps");
      console.log(chalk.blue(stdout));
    }
  }
}

export = Bhg;
