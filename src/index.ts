import { flags } from "@oclif/command";
// import { option } from "@oclif/parser/lib/flags";
import { exec as origExec } from "child_process";
import { promisify } from "util";
import ChalkLoggerCommand from "./chalk-logger-command";
import getOptions from "./get-options";

const exec = promisify(origExec);

const CLOUDSTUDY_ACI_CONTEXT = "cloudstudyAciContext";
const RG_CLOUDSTUDY_FE = "rg-CloudStudyFe";

const createContext = async (
  self: ChalkLoggerCommand,
  tenantId: string
): Promise<boolean> => {
  self.logOk(
    "A browser window will open, log in to the correct Azure instance"
  );
  try {
    const { stdout } = await exec(`docker login azure --tenant-id ${tenantId}`);
    if (stdout && stdout.indexOf("login succeeded") > -1) {
      self.logStep("Azure login OK");

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
  const { stdout } = await exec("docker context show");
  // TODO this will potentially fail when stdout starts with CLOUDSTUDY_ACI_CONTEXT but is different after that
  if (stdout && stdout.indexOf(CLOUDSTUDY_ACI_CONTEXT) > -1) {
    self.logStep(
      `You are in the ACI context "${CLOUDSTUDY_ACI_CONTEXT}"`
    );
      return true;
  }
  self.logStep(
    `You are not in the ACI context (${stdout}), I will try to switch to it`
  );
  try {
    const { stdout: stdout1 } = await exec(
      `docker context use ${CLOUDSTUDY_ACI_CONTEXT}`
    );
    self.logStep(`Now in context: ${stdout1}. Re-run the process to try now you are in the correct context`);
} catch (error) {
    if (
      (error as any).stderr &&
      (error as any).stderr.indexOf("not found") > -1
    ) {
      self.logStep("The ACI context does not exist yet, I will try to create it");
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

// const switchContext = async (self: ChalkLoggerCommand): Promise<boolean> => {
//   self.logOk("Switching to the ACI context");
//   try {
//     const { stdout } = await exec(
//       `docker context use ${CLOUDSTUDY_ACI_CONTEXT}`
//     );
//     self.log(stdout);
//     return true;
//     // if (stdout && stdout.indexOf("login succeeded") > -1) {
//     //   self.log("Azure login OK");

//     //   const { stdout: stdout1 } = await exec(
//     //     `docker context create aci ${CLOUDSTUDY_ACI_CONTEXT} --resource-group ${RG_CLOUDSTUDY_FE}`
//     //   );

//     //   if (stdout1 && stdout1.indexOf(`Successfully created aci context "${CLOUDSTUDY_ACI_CONTEXT}"`) > -1) {
//     //     self.log(stdout1);
//     //     return true;
//     //   }

//     //   throw new Error("Unexpected failure when creating context");
//     // }

//     // throw new Error("Unexpected failure when logging in");
//   } catch (error) {
//     self.logError(("Could not create context" + error) as any);
//     return false;
//   }
// };

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
      this.logStep("Trying to ps on ACI...");

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
  }
}

export = Bhg;
