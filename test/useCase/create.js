import GameStore from "../../src/game-store";

export const create = () => {
    const gs = new GameStore({
        state: {
            a: 1,
            obj: {
                b: 2,
            },
        },
    });

    const sequence = [];
    const latestVal = {};

    // 可以被触发
    gs.watch('a', (val, oldVal) => {
        latestVal['a'] = val;
        sequence.push('a');
    });
    // 可以被触发
    gs.watch('obj.b', (val, oldVal) => {
        latestVal['obj.b'] = val;
        sequence.push('obj.b');
    });
    // 不能被触发, 因为数据结构不在
    gs.watch('obj.c', (val, oldVal) => {
        latestVal['obj.c'] = val;
        sequence.push('obj.c');
    });
    // 可以被触发 (也会被子元素的修改触发)
    gs.watch('obj', (val, oldVal) => {
        latestVal['obj'] = val;
        sequence.push('obj');
    });

    return {
        gs,
        latestVal,
        sequence,
    };
};