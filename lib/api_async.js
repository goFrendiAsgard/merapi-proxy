"use strict";
const Promise = require("bluebird");
const camelCase = require("to-camel-case");
const snakeCase = require("to-snake-case");
const request = require("request-promise");
const sleep = require("sleep-promise");

module.exports = function(info, options, logger) {

    return Promise.coroutine(function*(methodName, args) {
        let ret = null;
        let uri = "http://" + info.uri + "/api/" + options.version + "/" + snakeCase(methodName);

        let count = 0;
        let retry = true;
        while (count < options.retry && retry) {
            try {
                ret = yield request({
                    uri: uri,
                    method: "POST",
                    headers: {
                        Authorization: options.secret ? "Bearer " + options.secret : ""
                    },
                    body: { params: args, source: options.source },
                    json: true,
                    timeout: options.timeout,
                    socketTimeout: options.timeout
                });
            }
            catch (e) {
                logger.warn(`Error at proxy call:`, e);
                retry = e.code !== "ETIMEDOUT";
            }

            retry = !ret && retry;
            if (retry) {
                yield sleep(options.waitTime);
                count++;
            }
        }

        if (ret && ret.status == "ok")
            return ret.result;
        else
            throw new Error(ret ? ret.error : "Unknown error");
    });
}