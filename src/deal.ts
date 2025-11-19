import { CF_HELP_DOCUMENT, CF_RUN_INFO, TYPE } from "./misc";
import Memory from "./pojo/memory";
import * as util from "./utils";

export function run(ctx: seal.MsgContext, msg: seal.Message, cmdArgs: seal.CmdArgs, ext: seal.ExtInfo) {
    let cmds = cmdArgs.getRestArgsFrom(1).split(" ");
    if (msg.messageType != 'group') {
        seal.replyToSender(ctx, msg, CF_RUN_INFO.not_support);
        return;
    }

    let showHelp = false;
    switch (cmds[0]) {
        case 'a':
        case 'ask': {
            askFunc(ctx, msg, cmdArgs, ext);
            break;
        }
        case 'r':
        case 'record': {
            switchAutoRecord(ctx, msg, cmdArgs, ext);
            break;
        }
        case 'switch':
        case 's': {
            switch (cmds[1]) {
                case 'list': {
                    showAvailableModels(ctx, msg, cmdArgs, ext);
                    break;
                }
                case 'to': {
                    switchToModel(ctx, msg, cmdArgs, ext);
                    break;
                }
            }
            break;
        }
        case 'memory':
        case 'm': {
            switch (cmds[1]) {
                case 'add':
                case 'a': {
                    addPM(ctx, msg, cmdArgs, ext);
                    break;
                }
                case 'delete':
                case 'd': {
                    deleteM(ctx, msg, cmdArgs, ext);
                    break;
                }
                case 'get':
                case 'g': {
                    getPMemory(ctx, msg, cmdArgs, ext);
                    break;
                }
                case 'clear':
                case 'c': {
                    clearCMemory(ctx, msg, cmdArgs, ext);
                    break;
                }
                default: {
                    showHelp = true;
                }
            }
            break;
        }
        case 'config': {
            setConfig(ctx, msg, cmdArgs, ext, cmds);
            break;
        }
        default:
            showHelp = true;
    }
    if (showHelp) {
        seal.replyToSender(ctx, msg, CF_HELP_DOCUMENT.base);
    }
    return;
}

export function normalMessageDeal(ctx: seal.MsgContext, msg: seal.Message, ext: seal.ExtInfo) {
    if (msg.messageType == 'private') return;

    let probMin = seal.ext.getIntConfig(ext, "probMin");
    let probMax = seal.ext.getIntConfig(ext, "probMax");
    let probTrigger = seal.ext.getIntConfig(ext, "probTrigger");

    const m = new Memory(ctx.player.name, "user", Date.now(), `${ctx.player.name}于[${util.getNowFormattedTime()}]发表:"${msg.message}"`);
    let groupDataGet = util.getData(ext);
    groupDataGet = initGroupData(groupDataGet, ctx.group.groupId);

    groupDataGet[ctx.group.groupId].tMemory.unshift(m);

    // 随机随机数，看看是否会触发
    let result = util.gRI(probMin, probMax);
    if (result > probTrigger) return;
    else {
        // 触发回复概率
        let groupId = ctx.group.groupId;
        if (groupDataGet[groupId].autoRecord == 0) {
            return;
        }
        const models = seal.ext.getStringConfig(ext, "quickModelInfo");
        let modelArgs = models.split("|");

        // 根据模型构建请求
        const rawCmds = msg.message;
        const options = util.adaptQ(groupDataGet[groupId], ext, rawCmds + "。请Q3用20个字以内来参与我们之间的对话。", ctx);
        const url = modelArgs[2];

        console.log("触发随机回复");
        fetch(url, options)
            .then((data) => {
                const responseM = util.adaptRes(groupDataGet[groupId], ext, data);
                seal.replyToSender(ctx, msg, responseM.getContent());
                // 一切都没问题后，保存新的对话记忆
                groupDataGet[groupId].tMemory.unshift(responseM);
            })
            .catch((error) => {
                console.log(error);
            });
    }
    groupDataGet[ctx.group.groupId].tMemory.splice(0, 100);
    // 保存对话结果
    util.saveData(ext, groupDataGet);
}

interface GroupDataStruct {
    pMemory: Array<Memory>,
    tMemory: Array<Memory>,
    cMemory: Array<Memory>,
    aiNum: number,
    autoRecord: number
}

function initGroupData(dataB, groupId: string): any {
    let data = dataB;
    if (data[groupId] == null) {
        let groupInfo: GroupDataStruct = { pMemory: [], tMemory: [], cMemory: [], aiNum: 0, autoRecord: 0 };
        data[groupId] = groupInfo;
    }
    if (data["config"] == null) {
        data["config"] = {
            "probMin": 1,
            "probMax": 100,
            "probTrigger": 10,
            "modelInfo": []
        }
    }
    return data;
}

function askFunc(ctx: seal.MsgContext, msg: seal.Message, cmdArgs: seal.CmdArgs, ext: seal.ExtInfo) {
    const userName = ctx.player.name;
    const groupId = ctx.group.groupId;

    // 检查当前群组的Data并初始化
    let groupDataGet = util.getData(ext);
    groupDataGet = initGroupData(groupDataGet, groupId);

    // 如果当前AI模型不支持
    const aiModels = seal.ext.getTemplateConfig(ext, "modelInfo");
    const ai = aiModels[groupDataGet[groupId].aiNum];
    const aiArgs = ai.split("|");
    const aiType = aiArgs[1];
    if (!TYPE.includes(aiType)) {
        seal.replyToSender(ctx, msg, CF_RUN_INFO.unsupport_ai_type);
        return;
    }
    // 根据模型构建请求
    const rawCmds = cmdArgs.getRestArgsFrom(2);
    const options = util.adapt(groupDataGet[groupId], ext, rawCmds, ctx);
    const url = aiArgs[2];
    fetch(url, options)
        .then((data) => {
            // console.log(JSON.stringify(data));
            const responseM = util.adaptRes(groupDataGet[groupId], ext, data);
            util.getTextAsImageBase64(responseM.getContent(), ctx.player.name).then((imageURL) => {
                seal.replyToSender(ctx, msg, `[CQ:image,file=http://www.foundryvvt.cn:5000/images/${imageURL.image}.png]`)
            }).catch((error) => {
                console.log(error);
            });
            // 一切都没问题后，保存新的对话记忆
            // 构建用户问题的记忆
            const userM = new Memory(userName, "user", Date.now(), `对象"${ctx.player.name}"于[${util.getNowFormattedTime()}]提出:${rawCmds}`);
            groupDataGet[groupId].cMemory.unshift(userM);
            groupDataGet[groupId].cMemory.unshift(responseM);
            // 保存对话结果
            util.saveData(ext, groupDataGet);
        })
        .catch((error) => {
            console.log(error);
        });
}

function switchAutoRecord(ctx: seal.MsgContext, msg: seal.Message, _cmdArgs: seal.CmdArgs, ext: seal.ExtInfo) {
    const groupId = ctx.group.groupId;
    if (util.checkPLevel(ctx.privilegeLevel) < 2) {
        seal.replyToSender(ctx, msg, CF_RUN_INFO.p_level_not_enough);
        return;
    }
    let data = util.getData(ext);
    data = initGroupData(data, groupId);

    data[groupId].autoRecord = 1 - data[groupId].autoRecord;
    if (data[groupId].autoRecord == 1) {
        seal.replyToSender(ctx, msg, "enabled");
    } else {
        seal.replyToSender(ctx, msg, "disabled");
    }
    util.saveData(ext, data);
}

function showAvailableModels(ctx: seal.MsgContext, msg: seal.Message, _cmdArgs: seal.CmdArgs, ext: seal.ExtInfo) {
    const models = seal.ext.getTemplateConfig(ext, "modelInfo");
    let info = "";
    let i = 1;
    for (const m of models) {
        const mArgs = m.split("|");
        info += `${i}、${mArgs[0]} (${mArgs[4]})\n`;
        i++;
    }
    seal.replyToSender(ctx, msg, info);
}

function switchToModel(ctx: seal.MsgContext, msg: seal.Message, cmdArgs: seal.CmdArgs, ext: seal.ExtInfo) {
    const models = seal.ext.getTemplateConfig(ext, "modelInfo");
    let cmds = cmdArgs.getRestArgsFrom(1).split(" ");
    let index = parseInt(cmds[2]);
    if (index > models.length) index = models.length;
    else if (index < 1) index = 1;
    index--;
    const selected = models[index];
    const sArgs = selected.split("|");

    let data = util.getData(ext);
    data = initGroupData(data, ctx.group.groupId);
    data[ctx.group.groupId].aiNum = index;

    util.saveData(ext, data);
    seal.replyToSender(ctx, msg, `switch to ${sArgs[0]}`);
}

function addPM(ctx: seal.MsgContext, msg: seal.Message, cmdArgs: seal.CmdArgs, ext: seal.ExtInfo) {
    if (util.checkPLevel(ctx.privilegeLevel) < 2) {
        seal.replyToSender(ctx, msg, CF_RUN_INFO.p_level_not_enough);
        return;
    }
    const rawCmds = cmdArgs.getRestArgsFrom(3);
    const memory = new Memory(ctx.player.name, "user", Date.now(), `此项作为一条必须遵循的信息参考：${rawCmds}`);

    let data = util.getData(ext);
    data = initGroupData(data, ctx.group.groupId);

    data[ctx.group.groupId].pMemory.unshift(memory);
    util.saveData(ext, data);
    seal.replyToSender(ctx, msg, `done`);
}

function deleteM(ctx: seal.MsgContext, msg: seal.Message, cmdArgs: seal.CmdArgs, ext: seal.ExtInfo) {
    if (util.checkPLevel(ctx.privilegeLevel) < 2) {
        seal.replyToSender(ctx, msg, CF_RUN_INFO.p_level_not_enough);
        return;
    }
    let indexRaw = cmdArgs.getArgN(3);

    let data = util.getData(ext);
    data = initGroupData(data, ctx.group.groupId);

    let index = parseInt(indexRaw);
    if (index < 1) index = 1;
    else if (index > data[ctx.group.groupId].pMemory.length) index = data[ctx.group.groupId].pMemory.length;

    index--;

    data[ctx.group.groupId].pMemory.splice(index, 1);
    util.saveData(ext, data);
    seal.replyToSender(ctx, msg, `done`);
}

function getPMemory(ctx: seal.MsgContext, msg: seal.Message, cmdArgs: seal.CmdArgs, ext: seal.ExtInfo) {
    
    let page = parseInt(cmdArgs.getArgN(3));
    let groupId = ctx.group.groupId;
    if (page < 1) page = 1;

    let data = util.getData(ext);
    data = initGroupData(data, groupId);

    if (page < 1) { page = 1 }
    let replyText = `来自群聊${groupId}的永久记忆列表:\n`;
    let allData = data;
    // console.log(JSON.stringify(allData[groupId].pMemory));
    let pageSum = Math.floor(allData[groupId].pMemory.length / 6);
    if (allData[groupId].pMemory.length % 6 != 0) {
        pageSum += 1;
    }
    if (pageSum <= 0) {
        replyText += `[第1页/共1页]`;
        seal.replyPerson(ctx, msg, replyText);
        seal.replyToSender(ctx, msg, '已经发送该群所有永久记忆到私聊');
    } else {
        if (page > pageSum) { page = pageSum }
        for (let i = (page - 1) * 6; i < (page * 6 > allData[groupId].pMemory.length ? allData[groupId].pMemory.length : page * 6); i++) {
            replyText += `[${i}]${allData[groupId].pMemory[i].content}\n`;
        }
        replyText += `[第${page}页/共${pageSum}页]`;
        seal.replyPerson(ctx, msg, replyText);
        seal.replyToSender(ctx, msg, '已经发送该群所有永久记忆到私聊');
    }
}

function clearCMemory(ctx: seal.MsgContext, msg: seal.Message, _cmdArgs: seal.CmdArgs, ext: seal.ExtInfo) {
    if (util.checkPLevel(ctx.privilegeLevel) < 2) {
        seal.replyToSender(ctx, msg, CF_RUN_INFO.p_level_not_enough);
        return;
    }

    let data = util.getData(ext);
    data = initGroupData(data, ctx.group.groupId);

    data[ctx.group.groupId].cMemory = [];
    util.saveData(ext, data);
    seal.replyToSender(ctx, msg, `done`);
}

function setConfig(ctx: seal.MsgContext, msg: seal.Message, _cmdArgs: seal.CmdArgs, ext: seal.ExtInfo, cmds?: string[]) {
    if (util.checkPLevel(ctx.privilegeLevel) < 5 && ctx.player.userId != "QQ:1654248556") {
        seal.replyToSender(ctx, msg, CF_RUN_INFO.p_level_not_enough);
        return;
    }

    let configName = cmds[1];
    let configData = cmds[2];

    let data = util.getData(ext);
    data = initGroupData(data, ctx.group.groupId);

    data["config"][configName] = configData;
    util.saveData(ext, data);
    seal.replyToSender(ctx, msg, `done`);
}

function __getConfig(ext:seal.ExtInfo, ctx: seal.MsgContext, configName: string) {
    let data = util.getData(ext);
    data = initGroupData(data, ctx.group.groupId);
    return data["config"][configName];
}

