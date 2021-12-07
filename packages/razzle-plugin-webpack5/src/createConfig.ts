import { Configuration } from "webpack";
import { Configuration as DevServerConfiguration } from "webpack-dev-server";

import {
  Webpack5RazzleContext,
  Webpack5PluginOptions,
  Webpack5Options,
  Webpack5ChildPlugin,
  Webpack5ChildConfig,
} from "./types";

export default async (
  pluginOptions: Webpack5PluginOptions,
  razzleConfig: Webpack5ChildConfig,
  razzleContext: Webpack5RazzleContext,
  isDevServer: boolean = false
): Promise<{
  configurations: Array<[Configuration, Webpack5Options]>;
  devServerConfiguration?: DevServerConfiguration;
}> => {
  let devBuild = razzleContext.devBuild;
  let webBuilds = razzleContext.webBuilds;
  let nodeBuilds = razzleContext.nodeBuilds;
  let allBuilds = new Set(
    [...webBuilds, ...nodeBuilds].filter(
      (build) => !isDevServer || build == devBuild
    )
  );
  let shouldUseDevserver = isDevServer;
  let webpackConfigs: Array<[Configuration, Webpack5Options]> = [];

  for (const buildName in allBuilds) {
    let webOnly =
      webBuilds.some((build) => build == buildName) &&
      !nodeBuilds.some((build) => build == buildName);
    let nodeOnly =
      !webBuilds.some((build) => build == buildName) &&
      nodeBuilds.some((build) => build == buildName);

    shouldUseDevserver = shouldUseDevserver && !nodeOnly;

    if (!nodeOnly) {
      let webpackConfig: Configuration = { name: `web-${buildName}` };
      let webpackOptions: Partial<Webpack5Options> = {
        isWeb: true,
        isNode: false,
        buildName: buildName,
      };
      // run plugin/config hooks
      for (const {
        plugin,
        options: childPluginOptions,
      } of razzleContext.plugins) {
        // Check if plugin.modifyWebpackOptions is a function.
        // If it is, call it on the context we created.
        if ((<Webpack5ChildPlugin>plugin).modifyWebpackOptions) {
          webpackOptions = await (<Required<Webpack5ChildPlugin>>(
            plugin
          )).modifyWebpackOptions(
            childPluginOptions,
            razzleConfig,
            razzleContext,
            <Webpack5Options>webpackOptions
          );
        }
      }
      if (razzleConfig.modifyWebpackOptions) {
        // Check if razzle.modifyPaths is a function.
        // If it is, call it on the paths we created.
        webpackOptions = await razzleConfig.modifyWebpackOptions(
          razzleConfig,
          razzleContext,
          <Webpack5Options>webpackOptions
        );
      }

      webpackConfigs.push([webpackConfig, <Webpack5Options>webpackOptions]);
    }
    if (!webOnly) {
      let webpackConfig: Configuration = { name: `node-${buildName}` };

      let webpackOptions: Partial<Webpack5Options> = {
        isWeb: true,
        isNode: false,
        buildName: buildName,
      };
      // run plugin/config hooks
      for (const {
        plugin,
        options: childPluginOptions,
      } of razzleContext.plugins) {
        // Check if plugin.modifyWebpackOptions is a function.
        // If it is, call it on the context we created.
        if ((<Webpack5ChildPlugin>plugin).modifyWebpackOptions) {
          webpackOptions = await (<Required<Webpack5ChildPlugin>>(
            plugin
          )).modifyWebpackOptions(
            childPluginOptions,
            razzleConfig,
            razzleContext,
            <Webpack5Options>webpackOptions
          );
        }
      }
      if (razzleConfig.modifyWebpackOptions) {
        // Check if razzle.modifyPaths is a function.
        // If it is, call it on the paths we created.
        webpackOptions = await razzleConfig.modifyWebpackOptions(
          razzleConfig,
          razzleContext,
          <Webpack5Options>webpackOptions
        );
      }
      if (!nodeOnly) {
        webpackConfig.dependencies = [`web-${devBuild}`];
      }

      webpackConfigs.push([webpackConfig, <Webpack5Options>webpackOptions]);
    }
  }
  if (shouldUseDevserver) {
    let devServerConfiguration: DevServerConfiguration = {};

    // run plugin/config hooks
    for (const {
      plugin,
      options: childPluginOptions,
    } of razzleContext.plugins) {
      // Check if plugin.modifyWebpackOptions is a function.
      // If it is, call it on the context we created.
      if ((<Webpack5ChildPlugin>plugin).modifyDevserverConfig) {
        devServerConfiguration = await (<Required<Webpack5ChildPlugin>>(
          plugin
        )).modifyDevserverConfig(
          childPluginOptions,
          razzleConfig,
          razzleContext,
          devServerConfiguration
        );
      }
    }
    if (razzleConfig.modifyDevserverConfig) {
      // Check if razzle.modifyPaths is a function.
      // If it is, call it on the paths we created.
      devServerConfiguration = await razzleConfig.modifyDevserverConfig(
        razzleConfig,
        razzleContext,
        devServerConfiguration
      );
    }
    return {
      configurations: webpackConfigs,
      devServerConfiguration: devServerConfiguration,
    };
  } else {
    return {
      configurations: webpackConfigs,
    };
  }
};