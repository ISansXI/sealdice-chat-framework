import { TYPE } from "./misc";
import Memory from "./pojo/memory";

const STORAGE_KEY = "sans-chat-framework-storage";

interface DataStruct {
    data: Array<Memory>,
    nextId: number
}

interface GroupDataStruct {
    pMemory: Array<Memory>,
    tMemory: Array<Memory>,
    cMemory: Array<Memory>,
    aiNum: number
}

interface OptionStruct {
    method: string,
    headers: {
        Authorization: string,
        'Content-Type': string
    },
    body: string
}

function initDataStruct() {
    const struct = '{}';
    return struct;
}

function getData(ext: seal.ExtInfo): DataStruct {
    //读取数据
    const getData = JSON.parse(ext.storageGet(STORAGE_KEY) || initDataStruct());
    return getData;
}

function saveData(ext: seal.ExtInfo, data: any): number {
    //存储数据
    try {
        ext.storageSet(STORAGE_KEY, JSON.stringify(data));
    }
    catch (e) {
        console.error(e);
        return 1;
    }
    return 0;
}

async function getTextAsImageBase64(text, playerName) {
    const response = await fetch('http://www.foundryvvt.cn:5000/text-to-image', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: text, sender: playerName })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

/**
 * 获取指定等级的用户组，0为普通，1为邀请者，2为管理，3为群主，4为信任，5为master
 * @param pLevel 
 * @returns 
 */
function checkPLevel(pLevel: number): number {
    switch (pLevel) {
        case 40:
            return 1;
        case 50:
            return 2;
        case 60:
            return 3;
        case 70:
            return 4;
        case 100:
            return 5;
        default:
            return 0;
    }
}

function adaptRequestOption(data: GroupDataStruct, ext: seal.ExtInfo, question: string, ctx: seal.MsgContext): OptionStruct {
    const aiArgs = seal.ext.getTemplateConfig(ext, "modelInfo")[data.aiNum].split("|");
    // aiArgs: Name|Type|Url|Key

    // 构建初始化的option
    let option = {
        method: 'POST',
        headers: {
            Authorization: '',
            'Content-Type': 'applicaiton/json'
        },
        body: ''
    }

    // 拼接记忆并调整option
    const type = aiArgs[1];
    let messages = [];
    let pMs = data.pMemory;
    let tMs = data.tMemory;
    let cMs = data.cMemory;
    switch (type) {
        case TYPE[0]:
            // Qwen
            // 设定Auth
            option.headers.Authorization = `Bearer ${aiArgs[3]}`;
            // 加载当前问题
            let message = {};
            message["role"] = "user";
            message["content"] = `对象"${ctx.player.name}"于[${getNowFormattedTime()}]提出:${question}`;
            messages.unshift(message);
            // 加载身份设定
            let message1 = {};
            message1["role"] = "user";
            message1["content"] = `你现在叫Q3,一名群聊助手,比较擅长吐槽,接下来会有不同的要求或人在群聊里说话。你的制造主为一名叫'地星'的人。`;
            messages.unshift(message1);
            // 加载永久记忆
            for (let m of pMs) {
                let message = {};
                message["role"] = m.getRole();
                message["content"] = m.toFormattedString();
                messages.unshift(message);
            }
            // 加载对话记忆
            for (let m of cMs) {
                let message = {};
                message["role"] = m.getRole();
                message["content"] = m.toFormattedString();
                messages.unshift(message);
            }
            // 加载临时记忆
            let count = 0;
            for (let m of tMs) {
                if (count == 100) {
                    break;
                }
                let message = {};
                message["role"] = m.getRole();
                message["content"] = m.toFormattedString();
                messages.unshift(message);
                count++;
            }
            break;
        default:
            return null;
    }

    // 构建完整的option
    let body = {};
    body["model"] = aiArgs[0];
    body["messages"] = messages;
    option.body = JSON.stringify(body);

    return option;
}

function adaptRequestResponse(data: GroupDataStruct, ext: seal.ExtInfo, responseData: any): Memory {
    const aiArgs = seal.ext.getTemplateConfig(ext, "modelInfo")[data.aiNum].split("|");
    // aiArgs: Name|Type|Url|Key

    // 关键词确认
    let creator = "Q3";
    let role = "";
    let createTime = Date.now();
    let content = "";

    // 根据模型获取数据
    const type = aiArgs[1];
    switch (type) {
        case TYPE[0]:
            // Qwen
            role = "assistant";
            content = responseData.choices[0].message.content;
            const m = new Memory(creator, role, createTime, content);
            return m;
        default:
            return null;
    }
}

/**
 * 辅助方法：数字补零
 * @param num 需要补零的数字
 * @returns 补零后的字符串
 */
function padZero(num: number): string {
    return num < 10 ? `0${num}` : num.toString();
}
/**
 * 格式化显示记忆创建时间
 * @returns 格式化后的时间字符串（如：2025-11-18 12:30:45）
 */
function getNowFormattedTime(): string {
    const date = new Date();
    return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())} ${padZero(date.getHours())}:${padZero(date.getMinutes())}:${padZero(date.getSeconds())}`;
}

function getRandomInteger(a: number, b: number): number {
    // 确保a和b都是整数
    const min = Math.ceil(a);
    const max = Math.floor(b);

    // 处理a > b的情况，交换它们
    const actualMin = Math.min(min, max);
    const actualMax = Math.max(min, max);

    // 生成[actualMin, actualMax]之间的随机整数
    // 公式：Math.floor(Math.random() * (max - min + 1)) + min
    return Math.floor(Math.random() * (actualMax - actualMin + 1)) + actualMin;
}

export {
    getData,
    saveData,
    checkPLevel,
    adaptRequestOption as adapt,
    adaptRequestResponse as adaptRes,
    getTextAsImageBase64,
    getRandomInteger as gRI
}
