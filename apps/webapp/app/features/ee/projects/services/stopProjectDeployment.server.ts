import { CakeworkApiError } from "@cakework/client/dist";
import type { PrismaClient } from "~/db.server";
import { prisma } from "~/db.server";
import { projectLogger } from "~/services/logger";
import { cakework } from "../cakework.server";

export class StopProjectDeployment {
  #prismaClient: PrismaClient;
  #stoppableStatuses = ["BUILDING", "DEPLOYED"];

  constructor(prismaClient: PrismaClient = prisma) {
    this.#prismaClient = prismaClient;
  }

  async call(id: string) {
    const deployment = await this.#prismaClient.projectDeployment.findUnique({
      where: {
        id,
      },
      include: {
        project: true,
      },
    });

    if (!deployment) {
      return true;
    }

    if (!this.#stoppableStatuses.includes(deployment.status)) {
      return true;
    }

    try {
      if (deployment.vmIdentifier) {
        projectLogger.debug("Stopping deployment", { deployment });

        await this.#prismaClient.projectDeployment.update({
          where: {
            id,
          },
          data: {
            status: "STOPPING",
            stoppedAt: new Date(),
          },
        });

        await this.#prismaClient.repositoryProject.update({
          where: {
            id: deployment.projectId,
          },
          data: {
            updatedAt: new Date(),
          },
        });

        await cakework.stopVm(deployment.vmIdentifier);

        projectLogger.debug("Stopped deployment", { deployment });
      }

      await this.#prismaClient.projectDeployment.update({
        where: {
          id,
        },
        data: {
          status: "STOPPED",
          stoppedAt: new Date(),
        },
      });

      await this.#prismaClient.repositoryProject.update({
        where: {
          id: deployment.projectId,
        },
        data: {
          updatedAt: new Date(),
        },
      });

      return true;
    } catch (error) {
      if (error instanceof CakeworkApiError) {
        projectLogger.debug("Failed to stop deployment", { deployment, error });

        return false;
      }

      throw error;
    }
  }
}
