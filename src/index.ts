/*
 * @Description:
 * @Version: 0.1
 * @Author: EveChee
 * @Date: 2020-05-20 17:02:09
 * @LastEditTime: 2020-11-24 16:31:23
 */
import { VueConstructor } from 'vue'

/* eslint-disable */
interface SSpaConfig {
    Vue: VueConstructor | null
    appOptions: any | null
    template?: any
    loadRootComponent?: any
    rootComponent?: any
}
const defaultOpts = {
    // required opts
    Vue: null,
    appOptions: null,
    template: null,
}

export default function singleSpaVue(userOpts: object) {
    if (typeof userOpts !== 'object') {
        throw new Error(`single-spa-vue requires a configuration object`)
    }

    const opts: SSpaConfig = {
        ...defaultOpts,
        ...userOpts,
    }

    if (!opts.Vue) {
        throw new Error('single-spa-vuejs must be passed opts.Vue')
    }

    if (!opts.appOptions) {
        throw new Error('single-spa-vuejs must be passed opts.appOptions')
    }

    // 挂载根实例
    let mountedInstances = {}

    return {
        bootstrap: bootstrap.bind(null, opts, mountedInstances),
        mount: mount.bind(null, opts, mountedInstances),
        unmount: unmount.bind(null, opts, mountedInstances),
        update: update.bind(null, opts, mountedInstances),
        mountedInstances,
    }
}

function bootstrap(opts: SSpaConfig) {
    if (opts.loadRootComponent) {
        return opts
            .loadRootComponent()
            .then((root: any) => (opts.rootComponent = root))
    } else {
        return Promise.resolve()
    }
}

function mount(opts: SSpaConfig, mountedInstances: any, props: any) {
    const { keepAlive, activesApp, name, parent } = props
    let instance = mountedInstances[name]
    const { appOptions } = opts
    let $el = opts.appOptions?.el
    if ($el) $el = document.querySelector($el)
    const $parent = parent || document.body
    console.log(name, '初始化了')
    return Promise.resolve().then(() => {
        if (!instance || ($el && $el.innerHTML === '')) {
            // 初次访问注册
            instance = {}
            let domEl
            if (!appOptions.el) {
                // 没有指定子应用容器
                const htmlId = `single-spa-application:${name}`
                // CSS.escape的文档（需考虑兼容性）：https://developer.mozilla.org/zh-CN/docs/Web/API/CSS/escape
                appOptions.el = `#${CSS.escape(htmlId)}`
                domEl = document.getElementById(htmlId)
                if (!domEl) {
                    // 未获取到元素的情况
                    domEl = createElement(htmlId)
                    $parent.appendChild(domEl)
                }
            } else {
                if (typeof appOptions.el === 'string') {
                    // 如果没有这个容器元素
                    domEl = !$el ? createElement(appOptions.el.substr(1)) : $el
                } else {
                    // 直接传dom的情况
                    domEl = appOptions.el
                }
                $parent.appendChild(domEl)
            }

            instance.domId = appOptions.el

            if (
                !appOptions.render &&
                !appOptions.template &&
                opts.rootComponent
            ) {
                appOptions.render = (h: (arg0: any) => any) =>
                    h(opts.rootComponent)
            }

            appOptions.data = Object.assign({}, appOptions.data, props)
            // 开始挂载
            instance.vueInstance = opts.Vue && new opts.Vue(appOptions)
            // 估计是确保实例以及vue内部有一个自身实例 确保this不乱
            instance.vueInstance.bind &&
                Reflect.set(
                    instance,
                    'vueInstance',
                    instance.vueInstance.bind(instance.vueInstance)
                )

            mountedInstances[name] = instance
            // 添加进活跃池
            keepAlive && !activesApp.has(name) && activesApp.push(name)
        } else {
            // 二次直接展示
            instance.vueInstance.$el.style.display = 'block'
        }
        return instance.vueInstance
    })
}

function update(opts: SSpaConfig, mountedInstances: any, props: any) {
    return Promise.resolve().then(() => {
        const instance = mountedInstances[props.name]
        const data = {
            ...(opts.appOptions.data || {}),
            ...props,
        }
        for (let prop in data) {
            instance.vueInstance[prop] = data[prop]
        }
    })
}

function unmount(opts: SSpaConfig, mountedInstances: any, props: any) {
    const { keepAlive, activesApp, name } = props
    return Promise.resolve().then(() => {
        const instance = mountedInstances[name]

        if (keepAlive && activesApp && activesApp.has(name)) {
            instance.vueInstance.$el.style.display = 'none'
        } else {
            instance.vueInstance.$destroy()
            instance.vueInstance.$el.innerHTML = ''
            delete instance.vueInstance
            if (instance.domId) {
                const domEl = document.querySelector(instance.domId)
                domEl.innerHTML = ''
                domEl.parentNode.removeChild(domEl)
                delete instance.domId
            }
            mountedInstances[name] = null
        }
        return instance
    })
}

function createElement(id: string) {
    const div = document.createElement('div')
    div.id = id
    return div
}
