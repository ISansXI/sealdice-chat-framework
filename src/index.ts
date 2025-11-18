import { normalMessageDeal, run } from "./deal";
import * as misc from "./misc"

function main() {
  // 创建扩展
  let ext = seal.ext.find(misc.CF_EXT_INFO.ext_name);
  if (!ext) {
    ext = seal.ext.new(misc.CF_EXT_INFO.ext_name, misc.CF_EXT_INFO.author, misc.CF_EXT_INFO.version);
  }

  // 编写指令
  const cmdSeal = seal.ext.newCmdItemInfo();
  cmdSeal.name = misc.CF_EXT_INFO.ext_name;
  cmdSeal.help = misc.CF_HELP_DOCUMENT.base;

  cmdSeal.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    switch (val) {
      case 'help': {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        run(ctx, msg, cmdArgs, ext);
      }
    }
    return seal.ext.newCmdExecuteResult(true);
  }

  // 注册非命令
  ext.onNotCommandReceived = (ctx, msg) => {
    normalMessageDeal(ctx, msg, ext);
  }

  // 注册命令
  for (let word of misc.CF_EXT_INFO.awake_words) {
    ext.cmdMap[word] = cmdSeal;
  }

  // 注册扩展
  seal.ext.register(ext);

  // 注册配置项
  seal.ext.registerIntConfig(ext, "probMin", 1);
  seal.ext.registerIntConfig(ext, "probMax", 100);
  seal.ext.registerIntConfig(ext, "probTrigger", 5);
  seal.ext.registerStringConfig(ext, "如何填写modelInfo", "Name|Type|Url|Key");
  seal.ext.registerOptionConfig(ext, "目前支持的Type", "请选择", ["请选择", "Qwen"]);
  seal.ext.registerTemplateConfig(ext, "modelInfo", ["Name|Type|Url|Key", "more", "more"]);

}

main();
