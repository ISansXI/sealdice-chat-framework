/**
 * 记忆信息类，用于存储AI聊天的记忆数据
 */
class Memory {
    /** 记忆创建者（通常是用户的QQ号或昵称） */
    public creator: string;

    /** 发送对象 */
    public role: string;

    /** 记忆创建时间（时间戳格式） */
    public createTime: number;

    /** 记忆内容 */
    public content: string;

    /**
     * 全参构造方法，创建记忆实例
     * @param creator 记忆创建者
     * @param role 发送的对象,一般为assistant或user,取决于模型
     * @param createTime 记忆创建时间（时间戳，毫秒级）
     * @param content 记忆内容
     */
    constructor(creator: string, role:string, createTime: number, content: string) {
        this.creator = creator;
        this.role = role;
        this.createTime = createTime;
        this.content = content;
    }

    /**
     * 获取记忆创建者
     * @returns 创建者信息
     */
    getCreator(): string {
        return this.creator;
    }

    /**
     * 获取记忆对象
     * @returns 对象信息
     */
    getRole(): string {
        return this.role;
    }

    /**
     * 获取记忆创建时间
     * @returns 时间戳（毫秒级）
     */
    getCreateTime(): number {
        return this.createTime;
    }

    /**
     * 获取记忆内容
     * @returns 记忆内容字符串
     */
    getContent(): string {
        return this.content;
    }

    /**
     * 格式化显示记忆创建时间
     * @returns 格式化后的时间字符串（如：2025-11-18 12:30:45）
     */
    getFormattedTime(): string {
        const date = new Date(this.createTime);
        return `${date.getFullYear()}-${this.padZero(date.getMonth() + 1)}-${this.padZero(date.getDate())} ${this.padZero(date.getHours())}:${this.padZero(date.getMinutes())}:${this.padZero(date.getSeconds())}`;
    }

    /**
     * 辅助方法：数字补零
     * @param num 需要补零的数字
     * @returns 补零后的字符串
     */
    private padZero(num: number): string {
        return num < 10 ? `0${num}` : num.toString();
    }

    /**
     * 转换为字符串表示
     * @returns 记忆信息的字符串描述
     */
    toString(): string {
        return `[${this.getFormattedTime()}] ${this.creator}: ${this.content}`;
    }

    /**
     * 转化为标准格式化字符串
     * @return 标准格式化字符串
     */
    toFormattedString(): string {
        return `对象"${this.getCreator()}"于[${this.getFormattedTime() }]提出:${ this.getContent() }`
    }
}

export default Memory;