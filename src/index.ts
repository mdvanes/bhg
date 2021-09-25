import { flags } from "@oclif/command";
import chalk = require("chalk");
// import { option } from "@oclif/parser/lib/flags";
import { exec as origExec } from "child_process";
import { promisify } from "util";
import ChalkLoggerCommand from "./chalk-logger-command";
import getOptions from "./get-options";
import Listr from "listr";
// import Conf from "conf";
import execa from "execa";

const exec = promisify(origExec);

const CLOUDSTUDY_ACI_CONTEXT = "cloudstudyAciContext";
const RG_CLOUDSTUDY_FE = "rg-CloudStudyFe";

const wait = () =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve(1);
    }, 1000);
  });

const createContext = async (
  self: ChalkLoggerCommand,
  tenantId: string
): Promise<boolean> => {
  self.logOk(
    "A browser window will open, log in to the correct Azure instance"
  );
  try {
    self.log(chalk.bgBlack(`docker login azure --tenant-id ${tenantId}`));
    const { stdout } = await exec(`docker login azure --tenant-id ${tenantId}`);
    if (stdout && stdout.indexOf("login succeeded") > -1) {
      self.logStep("Azure login OK");

      self.log(
        chalk.bgBlack(
          `docker context create aci ${CLOUDSTUDY_ACI_CONTEXT} --resource-group ${RG_CLOUDSTUDY_FE}`
        )
      );
      const { stdout: stdout1 } = await exec(
        `docker context create aci ${CLOUDSTUDY_ACI_CONTEXT} --resource-group ${RG_CLOUDSTUDY_FE}`
      );

      if (
        stdout1 &&
        stdout1.indexOf(
          `Successfully created aci context "${CLOUDSTUDY_ACI_CONTEXT}"`
        ) > -1
      ) {
        self.logStep(stdout1);
        return true;
      }

      throw new Error("Unexpected failure when creating context");
    }

    throw new Error("Unexpected failure when logging in");
  } catch (error) {
    self.logError(("Could not create context" + error) as any);
    return false;
  }
};

const prepareContext = async (
  self: ChalkLoggerCommand,
  tenantId: string
): Promise<boolean> => {
  self.log(chalk.bgBlack("docker context show"));
  const { stdout } = await exec("docker context show");
  // TODO this will potentially fail when stdout starts with CLOUDSTUDY_ACI_CONTEXT but is different after that
  if (stdout && stdout.indexOf(CLOUDSTUDY_ACI_CONTEXT) > -1) {
    self.logStep(`You are in the ACI context "${CLOUDSTUDY_ACI_CONTEXT}"`);
    return true;
  }
  self.logStep(
    `You are not in the ACI context (${stdout}), I will try to switch to it`
  );
  try {
    self.log(chalk.bgBlack(`docker context use ${CLOUDSTUDY_ACI_CONTEXT}`));
    const { stdout: stdout1 } = await exec(
      `docker context use ${CLOUDSTUDY_ACI_CONTEXT}`
    );
    self.logStep(
      `Now in context: ${stdout1}. Re-run the process to try now you are in the correct context`
    );
  } catch (error) {
    if (
      (error as any).stderr &&
      (error as any).stderr.indexOf("not found") > -1
    ) {
      self.logStep(
        "The ACI context does not exist yet, I will try to create it"
      );
      const isCreated = await createContext(self, tenantId);
      if (isCreated) {
        self.logStep(
          "Re-run the process to try now the ACI context has been created"
        );
      }
    }
    self.log((error as any).stderr); // TODO remove
  }
  return false;
};

class Bhg extends ChalkLoggerCommand {
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
    {
      name: "pcom",
      description: "pseudo command",
      options: ["ps", "ps2", "start"],
    }, // TODO convert to multi command
  ];

  async run() {
    const { args, flags } = this.parse(Bhg);

    const name = flags.name ?? "world";
    this.log(`hello ${name} from ./src/index.ts`);
    // if (args.file && flags.force) {
    //   this.log(`you input --force and --file: ${args.file}`)
    // }
    if (args.pcom === "ps") {
      this.log(
        `${chalk.blueBright("BlueHyperGiant")} running ${chalk.bgBlack(
          "docker ps -a"
        )} on ACI`
      );

      const { tenantId } = getOptions(this);

      this.logStep(`Found this tenantId: ${tenantId}`);

      const isContextReady = await prepareContext(this, tenantId);

      if (isContextReady) {
        const { stdout } = await exec("docker ps -a");
        this.logProcOutput(stdout);
      }

      // TODO docker login azure --tenant-id <my_tenant_id>
      // TODO docker context create cloudstudyAciContext
    }

    if (args.pcom === "ps2") {
      // For migrating ps implementation to listr
      this.log("ps2!");
      const tasks = new Listr(
        [
          // {
          //   title: "Fake wait",
          //   task: async (_ctx, task) => {
          //     task.output = "Waiting fakely...";

          //     return wait();
          //   },
          // },
          {
            title: "Check ACI context",
            task: async (ctx, task) => {
              const cmd: [string, string[]] = ["docker", ["context", "show"]];
              // this.logStep(cmd.join());
              task.output = cmd.join(" ");
              try {
                // const x = await execa("docker", ["context", "show"]);
                const { stdout } = await execa(...cmd);
                ctx.dockerContext = stdout;

                if (ctx.dockerContext === CLOUDSTUDY_ACI_CONTEXT) {
                  // this.log("all is well!");
                  task.output = "all is well!";
                } else {
                  // this.log(`context is: ${ctx.dockerContext}`);
                  task.output = `context is: ${ctx.dockerContext}`;
                }

                // this.log(stdout);
              } catch (error) {
                this.log("error", error);
              }
            },
          },
          {
            title: "Not in ACI context, trying to switch to it",
            // skip: (ctx) => {
            //   return ctx.dockerContext === CLOUDSTUDY_ACI_CONTEXT;
            // },
            enabled: (ctx) => {
              return ctx.dockerContext !== CLOUDSTUDY_ACI_CONTEXT;
            },
            task: async (_ctx, task) => {
              task.output = `You are not in the ACI context (${CLOUDSTUDY_ACI_CONTEXT}), I will try to switch to it`;
              await wait();
              const cmd: [string, string[]] = [
                "docker",
                ["context", "use", CLOUDSTUDY_ACI_CONTEXT],
              ];
              const { stdout } = await execa(...cmd);
              task.output = stdout;
              await wait();
              // self.logStep(
              //   `You are not in the ACI context (${stdout}), I will try to switch to it`
              // );
              // try {
              //   self.log(chalk.bgBlack(`docker context use ${CLOUDSTUDY_ACI_CONTEXT}`));
              //   const { stdout: stdout1 } = await exec(
              //     `docker context use ${CLOUDSTUDY_ACI_CONTEXT}`
              //   );
              //   self.logStep(
              //     `Now in context: ${stdout1}. Re-run the process to try now you are in the correct context`
              //   );
              // } catch (error) {
              throw new Error(
                `Now in context: ${CLOUDSTUDY_ACI_CONTEXT}. Re-run the process to try now you are in the correct context`
              );
            },
          },
        ],
        { renderer: "default" }
      );
      tasks.run().catch((error) => this.log(error));
    }
  }
}

export = Bhg;
