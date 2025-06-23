// 时间格式过滤器
import dayjs from "dayjs";
export function formatTime(value) {
    return {
        value,
        format(format = "YYYY-MM-DD HH:mm:ss") {
            return dayjs(this.value).format(format);
        },
    };
}
export function CurrentTime() {
    // 返回一个对象，包含日期、时间和星期几
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0"); // 月份是从0开始的，所以要+1
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    const _date = `${year}-${month}-${day}`;
    const _time = `${hours}:${minutes}:${seconds}`;
    const _weekday = weekdays[now.getDay()];
    return { date: _date, time: _time, weekday: _weekday };
}
