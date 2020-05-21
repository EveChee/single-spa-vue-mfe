import singleSpaVue, { setPath } from '../src/index'
import Vue from 'vue'

test('webpack_public路径设置 非微前端模式', () => {
    const path = 'test'
    setPath(path)
    expect((<any>window).__webpack_public_path__).toBeUndefined()
})

test('生成生命周期', () => {
    const life = singleSpaVue({
        Vue,
        appOptions: {
            render: (h: any) => h('这里没有组件 只测试是否返回正确的生命周期'),
        },
    })
    expect(typeof life.mount).toBe('function')
    expect(typeof life.bootstrap).toBe('function')
    expect(typeof life.unmount).toBe('function')
    expect(typeof life.update).toBe('function')
    expect(typeof life.mountedInstances).toBe('object')
})
