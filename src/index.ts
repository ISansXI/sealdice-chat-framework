import { normalMessageDeal, run } from "./deal";
import * as misc from "./misc"

console.log('chat-framework 插件加载')
// 创建扩展
let ext = seal.ext.find(misc.CF_EXT_INFO.ext_name);
if (!ext) {
  ext = seal.ext.new(misc.CF_EXT_INFO.ext_name, misc.CF_EXT_INFO.author, misc.CF_EXT_INFO.version);
  // 注册扩展
  seal.ext.register(ext);
}

// 编写指令
const cmdChatFramework = seal.ext.newCmdItemInfo();
cmdChatFramework.name = misc.CF_EXT_INFO.ext_name;
cmdChatFramework.help = misc.CF_HELP_DOCUMENT.base;

cmdChatFramework.solve = (ctx, msg, cmdArgs) => {
  console.log("接收到指令:", msg.message); // 新增日志，打印原始指令
  let val = cmdArgs.getArgN(1);
  switch (val) {
    case 'help': {
      const ret = seal.ext.newCmdExecuteResult(true);
      ret.showHelp = true;
      return ret;
    }
    default: {
      run(ctx, msg, cmdArgs, ext);
      return seal.ext.newCmdExecuteResult(true);
    }
  }
}

// 注册非命令
ext.onNotCommandReceived = (ctx, msg) => {
  normalMessageDeal(ctx, msg, ext);
}

// 注册命令
for (let word of misc.CF_EXT_INFO.awake_words) {
  ext.cmdMap[word] = cmdChatFramework;
  console.log(`已注册唤醒词: ${word}`); // 新增日志
}

// 注册配置项
seal.ext.registerIntConfig(ext, "probMin", 1);
seal.ext.registerIntConfig(ext, "probMax", 100);
seal.ext.registerIntConfig(ext, "probTrigger", 5);
seal.ext.registerStringConfig(ext, "quickModelInfo", "Name|Type|Url|Key");
seal.ext.registerStringConfig(ext, "prompt", "你现在叫Q3,一名群聊助手,比较擅长吐槽,接下来会有不同的要求或人在群聊里说话。你的制造主为一名叫'地星'的人。");
seal.ext.registerTemplateConfig(ext, "modelInfo", ["Name|Type|Url|Key|Description"]);

console.log('插件注册结果：', seal.ext.find(misc.CF_EXT_INFO.ext_name) ? '成功' : '失败');
console.log('命令对象是否有效：', cmdChatFramework && typeof cmdChatFramework.solve === 'function' ? '是' : '否');

