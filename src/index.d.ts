import {Observer} from "../libs2/observer";
import {WatcherBase} from "../libs2/watcher";

interface GameStoreData {
    __ob__: Observer,
    _watchers : WatcherBase[],

    /**
     * 是否正在被销毁
     * @type {boolean}
     * @private
     */
    _isBeingDestroyed: boolean,
}

declare class GameStore {
    _data: GameStoreData;
    _mutations: { [key: string]: ((...args: any[]) => any), };
    _isModule: boolean;
    [key: string]: any;

}