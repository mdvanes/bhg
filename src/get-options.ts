/* eslint-disable no-process-exit */
/* eslint-disable unicorn/no-process-exit */

import ChalkLoggerCommand from "./chalk-logger-command";
import { readFileSync } from "fs";
import { homedir } from "os";

interface BhgOptions {
  tenantId: string;
}

const getOptions = (self: ChalkLoggerCommand): BhgOptions => {
  const OPTIONS_PATH = `${homedir}/.bhg/options.json`;
  const INVALID_TENANT_ID = "INVALID_TENANT_ID";

  try {
    const optionsJson = readFileSync(OPTIONS_PATH);
    const options: BhgOptions = JSON.parse(optionsJson.toString());
    if (options.tenantId) {
      // tenantId = options.tenantId;
      return options;
    }
    throw new Error(INVALID_TENANT_ID);
  } catch (error) {
    if ((error as Error).message === INVALID_TENANT_ID) {
      self.logError(
        `You should fill ${OPTIONS_PATH} with { "tenantId": "TENANT_ID" } where TENANT_ID is an ID that can be found on Azure Active Directory`
      );
      process.exit(0);
    }
    if ((error as any).code === "ENOENT") {
      self.logError(
        `You should create a ${OPTIONS_PATH} containing { "tenantId": "TENANT_ID" } where TENANT_ID is an ID that can be found on Azure Active Directory`
      );
      process.exit(0);
    }
    throw error;
  }
};

export default getOptions;
