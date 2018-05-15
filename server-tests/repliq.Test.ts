///<reference path="../../../Library/Preferences/WebStorm2016.3/javascript/extLibs/http_github.com_DefinitelyTyped_DefinitelyTyped_raw_master_chai_index.d.ts"/>
///<reference path="../../../Library/Preferences/WebStorm2016.3/javascript/extLibs/http_github.com_DefinitelyTyped_DefinitelyTyped_raw_master_mocha_index.d.ts"/>


import {SpiderLib} from "../src/spiders";
import Base = Mocha.reporters.Base;

/**
 * Created by flo on 20/03/2017.
 */
var assert                      = require('assert')
var chai                        = require('chai')
var expect                      = chai.expect
var spider  : SpiderLib         = require('../src/spiders')

describe("Replication",() => {

    it("Master to replicas",function(done){
        this.timeout(10000)
        class TestRepliq extends spider.Repliq{
            field
            constructor(){
                super()
                this.field = 1
            }

            updateField(val){
                this.field = val
            }
        }
        class Master extends spider.Application{
            repliq
            constructor(){
                super()
                this.repliq = this.newRepliq(TestRepliq)
            }
        }
        class Slave extends spider.Actor{
            myReplica
            getRepliq(aReplica){
                this.myReplica = aReplica
            }

            retVal(){
                return this.myReplica.field.valueOf()
            }
        }
        var app = new Master()
        var a1  = app.spawnActor(Slave)
        a1.getRepliq(app.repliq)
        var a2  = app.spawnActor(Slave)
        a2.getRepliq(app.repliq)
        app.repliq.updateField(5)
        setTimeout(()=>{
            a1.retVal().then((v1)=>{
                a2.retVal().then((v2)=>{
                    try{
                        expect(v1).to.equal(5)
                        expect(v2).to.equal(5)
                        expect(app.repliq.field.valueOf()).to.equal(5)
                        app.kill()
                        done()
                    }
                    catch(e){
                        app.kill()
                        done(e)
                    }
                })
            })
        },2000)
    })

    it("Replicas to master",function (done){
        this.timeout(10000)
        class TestRepliq extends spider.Repliq{
            field
            constructor(){
                super()
                this.field = 1
            }

            updateField(val){
                this.field = val
            }
        }
        class Master extends spider.Application{
            repliq
            constructor(){
                super()
                this.repliq = this.newRepliq(TestRepliq)
            }
        }
        class Slave extends spider.Actor{
            myReplica
            getRepliq(aReplica){
                this.myReplica = aReplica
            }

            updateRepliq(){
                this.myReplica.updateField(5)
            }
        }
        var app = new Master()
        var a1  = app.spawnActor(Slave)
        a1.getRepliq(app.repliq)
        a1.updateRepliq()
        setTimeout(()=>{
            try{
                expect(app.repliq.field.valueOf()).to.equal(5)
                app.kill()
                done()
            }
            catch(e){
                app.kill()
                done(e)
            }
        },2000)
    })

    it("Actor as Master",function (done){
        this.timeout(10000)
        class TestRepliq extends spider.Repliq{
            field
            constructor(){
                super()
                this.field = 1
            }

            updateField(val){
                this.field = val
            }
        }
        class App extends spider.Application{
            myReplica
            getRepliq(aReplica){
                this.myReplica = aReplica
            }

            updateRepliq(){
                let res
                let prom = new Promise((resolve)=>{
                    res = resolve
                })
                this.myReplica.updateField(5).onceCommited(()=>{
                    res(this.myReplica.field.valueOf())
                })
                return prom
            }
        }
        class Slave extends spider.Actor{
            TestRepliq
            constructor(){
                super()
                this.TestRepliq = TestRepliq
            }

            init(){
                let rep = this.newRepliq(this.TestRepliq)
                this.parent.getRepliq(rep)
            }
        }
        var app = new App()
        var a1  = app.spawnActor(Slave)
        setTimeout(()=>{
            app.updateRepliq().then((v)=>{
                try{
                    expect(v).to.equal(5)
                    app.kill()
                    done()
                }
                catch(e){
                    app.kill()
                    done(e)
                }
            })
        },2000)
    })

    it("Re-Replication",function(done){
        this.timeout(10000)
        class TestRepliq extends spider.Repliq{
            field
            constructor(){
                super()
                this.field = 1
            }

            updateField(val){
                this.field = val
            }
        }
        class App extends spider.Application{
            forward(rep){
                slave.getRepliq(rep)
            }
        }
        class Master extends spider.Actor{
            TestRepliq
            constructor(){
                super()
                this.TestRepliq = TestRepliq
            }

            init(){
                let rep = this.newRepliq(this.TestRepliq)
                this.parent.forward(rep)
            }
        }

        class Slave extends spider.Actor{
            myRepliq
            getRepliq(rep){
                this.myRepliq = rep
            }

            update(){
                let res
                let prom = new Promise((resolve)=>{
                    res = resolve
                })
                this.myRepliq.updateField(5).onceCommited(()=>{
                    res(this.myRepliq.field.valueOf())
                })
                return prom
            }
        }
        var app = new App()
        var slave = app.spawnActor(Slave)
        var master = app.spawnActor(Master)
        setTimeout(()=>{
            slave.update().then((v)=>{
                try{
                    expect(v).to.equal(5)
                    app.kill()
                    done()
                }
                catch(e){
                    app.kill()
                    done(e)
                }
            })
        },2000)
    })
})

describe("Field Behaviour",() => {
    it("Default field LRW",function (done){
        this.timeout(10000)
        class TestRepliq extends spider.Repliq{
            field
            constructor(){
                super()
                this.field = 1
            }

            updateField(val){
                this.field = val
            }
        }
        class Master extends spider.Application{
            repliq
            constructor(){
                super()
                this.repliq = this.newRepliq(TestRepliq)
            }
        }
        class Slave extends spider.Actor{
            myReplica
            getRepliq(aReplica){
                this.myReplica = aReplica
            }

            updateRepliq(val){
                this.myReplica.updateField(val)
            }

            retVal(){
                return this.myReplica.field.valueOf()
            }
        }
        var app = new Master()
        var a1  = app.spawnActor(Slave)
        a1.getRepliq(app.repliq)
        var a2  = app.spawnActor(Slave)
        a2.getRepliq(app.repliq)
        a1.updateRepliq(5)
        setTimeout(()=>{
            a2.updateRepliq(10)
        },2000)
        setTimeout(()=>{
            a1.retVal().then((v1)=>{
                a2.retVal().then((v2)=>{
                    try{
                        expect(v1).to.equal(10)
                        expect(v2).to.equal(10)
                        expect(app.repliq.field.valueOf()).to.equal(10)
                        app.kill()
                        done()
                    }
                    catch(e){
                        app.kill()
                        done(e)
                    }
                })
            })
        },4000)
    })

    it("Custom update",function (done){
        class IncField extends spider.RepliqPrimitiveField{
            update(updates ){
                this.tentative += updates.length
            }
        }
        this.timeout(10000)
        class TestRepliq extends spider.Repliq{
            field
            constructor(){
                super()
                this.field = new IncField("field",1)
            }

            updateField(val){
                this.field = val
            }
        }
        class Master extends spider.Application{
            repliq
            constructor(){
                super()
                this.repliq = this.newRepliq(TestRepliq)
            }
        }
        class Slave extends spider.Actor{
            myReplica
            getRepliq(aReplica){
                this.myReplica = aReplica
            }

            updateRepliq(val){
                this.myReplica.updateField(val)
            }

            retVal(){
                return this.myReplica.field.valueOf()
            }
        }
        var app = new Master()
        var a1  = app.spawnActor(Slave)
        a1.getRepliq(app.repliq)
        var a2  = app.spawnActor(Slave)
        a2.getRepliq(app.repliq)
        a1.updateRepliq(5)
        a2.updateRepliq(10)
        setTimeout(()=>{
            a1.retVal().then((v1)=>{
                a2.retVal().then((v2)=>{
                    try{
                        expect(v1).to.equal(3)
                        expect(v2).to.equal(3)
                        expect(app.repliq.field.valueOf()).to.equal(3)
                        app.kill()
                        done()
                    }
                    catch(e){
                        app.kill()
                        done(e)
                    }
                })
            })
        },2000)
    })
})

describe("State Change Handling",()=>{
    it("onceCommited handler",function (done){
        this.timeout(10000)
        class TestRepliq extends spider.Repliq{
            field
            constructor(){
                super()
                this.field = 1
            }

            updateField(val){
                this.field = val
            }
        }
        class Master extends spider.Application{
            repliq
            handled
            constructor(){
                super()
                this.repliq = this.newRepliq(TestRepliq)
                this.handled = false
            }

            callbackHandled(){
                this.handled = true
            }
        }
        class Slave extends spider.Actor{
            myReplica
            getRepliq(aReplica){
                this.myReplica = aReplica
            }

            updateRepliq(val){
                this.myReplica.updateField(val).onceCommited(()=>{
                    this.parent.callbackHandled()
                })
            }
        }
        var app = new Master()
        var a1  = app.spawnActor(Slave)
        a1.getRepliq(app.repliq)
        a1.updateRepliq(5)
        setTimeout(()=>{
            try{
                expect(app.handled).to.equal(true)
                app.kill()
                done()
            }
            catch(e){
                app.kill()
                done(e)
            }
        },2000)
    })

    it("onCommit handler",function (done){
        this.timeout(10000)
        class TestRepliq extends spider.Repliq{
            field
            constructor(){
                super()
                this.field = 1
            }

            updateField(val){
                this.field = val
            }
        }
        class Master extends spider.Application{
            repliq
            handled
            constructor(){
                super()
                this.repliq = this.newRepliq(TestRepliq)
                this.handled = false
            }

            callbackHandled(val){
                this.handled = true
            }
        }
        class Slave extends spider.Actor{
            myReplica
            getRepliq(aReplica){
                this.myReplica = aReplica
            }

            updateRepliq(val){
                this.myReplica.field.onCommit(()=>{
                    this.parent.callbackHandled()
                })
                this.myReplica.updateField(val)
            }
        }
        var app = new Master()
        var a1  = app.spawnActor(Slave)
        a1.getRepliq(app.repliq)
        a1.updateRepliq(5)
        setTimeout(()=>{
            try{
                expect(app.handled).to.equal(true)
                app.kill()
                done()
            }
            catch(e){
                app.kill()
                done(e)
            }
        },2000)
    })

    it("onTentative handler",function (done){
        this.timeout(10000)
        class TestRepliq extends spider.Repliq{
            field
            constructor(){
                super()
                this.field = 1
            }

            updateField(val){
                this.field = val
            }
        }
        class Master extends spider.Application{
            repliq
            handled
            constructor(){
                super()
                this.repliq = this.newRepliq(TestRepliq)
                this.handled = false
            }

            callbackHandled(val){
                this.handled = true
            }
        }
        class Slave extends spider.Actor{
            myReplica
            getRepliq(aReplica){
                this.myReplica = aReplica
            }

            updateRepliq(val){
                this.myReplica.field.onTentative(()=>{
                    this.parent.callbackHandled()
                })
                this.myReplica.updateField(val)
            }
        }
        var app = new Master()
        var a1  = app.spawnActor(Slave)
        a1.getRepliq(app.repliq)
        a1.updateRepliq(5)
        setTimeout(()=>{
            try{
                expect(app.handled).to.equal(true)
                app.kill()
                done()
            }
            catch(e){
                app.kill()
                done(e)
            }
        },2000)
    })
})

describe("Annotations",()=>{
    it("Atomic method",function (done){
        this.timeout(10000)
        class TestField extends spider.RepliqPrimitiveField{
            update(updates){
                this.tentative = updates.length
            }
        }
        class TestRepliq extends spider.Repliq{
            field
            constructor(){
                super()
                this.field = new TestField("field",1)
            }

            @spider.atomic
            updateField(val){
                this.field = val
                this.field = val + 1
                this.field = val + 2
            }
        }
        class Master extends spider.Application{
            repliq
            handled
            constructor(){
                super()
                this.repliq = this.newRepliq(TestRepliq)
                this.handled = false
            }

        }
        class Slave extends spider.Actor{
            myReplica
            getRepliq(aReplica){
                this.myReplica = aReplica
            }

            updateRepliq(val){
                this.myReplica.updateField(val)
            }

            retVal(){
                return this.myReplica.field.valueOf()
            }
        }
        var app = new Master()
        var a1  = app.spawnActor(Slave)
        a1.getRepliq(app.repliq)
        a1.updateRepliq(5)
        setTimeout(()=>{
            a1.retVal().then((v)=>{
                try{
                    expect(v).to.equal(3)
                    expect(app.repliq.field.valueOf()).to.equal(3)
                    app.kill()
                    done()
                }
                catch(e){
                    app.kill()
                    done(e)
                }
            })
        },2000)
    })

    it("Built-in field annotations",function (done){
        this.timeout(10000)
        class TestRepliq extends spider.Repliq{
            @spider.LWR
            lwr
            @spider.Count
            count

            constructor(){
                super()
                this.lwr    = 1
                this.count  = 1
            }

            updateLwr(val){
                this.lwr = val
            }

            updateCount(val){
                this.count = this.count.read() + val
            }
        }

        class Master extends spider.Application{
            repliq
            handled
            constructor(){
                super()
                this.repliq = this.newRepliq(TestRepliq)
                this.handled = false
            }

        }
        class Slave extends spider.Actor{
            myReplica
            getRepliq(aReplica){
                this.myReplica = aReplica
            }

            updateCount(val){
                this.myReplica.updateCount(val)
            }

            updateLwr(val){
                this.myReplica.updateLwr(val)
            }

            retVal(){
                return [this.myReplica.count.valueOf(),this.myReplica.lwr.valueOf()]
            }
        }
        var app = new Master()
        var a1  = app.spawnActor(Slave)
        a1.getRepliq(app.repliq)
        a1.updateCount(3)
        a1.updateLwr(5)
        setTimeout(()=>{
            a1.retVal().then((v)=>{
                try{
                    expect(v[0]).to.equal(4)
                    expect(v[1]).to.equal(5)
                    app.kill()
                    done()
                }
                catch(e){
                    app.kill()
                    done(e)
                }
            })
        },2000)
    })

    it("Custom field annotations",function (done){
        this.timeout(10000)
        class TestField extends spider.RepliqPrimitiveField{
            update(updates){
                this.tentative = updates.length
            }
        }
        var Test = spider.makeAnnotation(TestField)
        class TestRepliq extends spider.Repliq{
            @Test
            field
            constructor(){
                super()
                this.field = 1
            }

            @spider.atomic
            updateField(val){
                this.field = val
                this.field = val + 1
                this.field = val + 2
            }
        }
        class Master extends spider.Application{
            repliq
            handled
            constructor(){
                super()
                this.repliq = this.newRepliq(TestRepliq)
                this.handled = false
            }

        }
        class Slave extends spider.Actor{
            myReplica
            getRepliq(aReplica){
                this.myReplica = aReplica
            }

            updateRepliq(val){
                this.myReplica.updateField(val)
            }

            retVal(){
                return this.myReplica.field.valueOf()
            }
        }
        var app = new Master()
        var a1  = app.spawnActor(Slave)
        a1.getRepliq(app.repliq)
        a1.updateRepliq(5)
        setTimeout(()=>{
            a1.retVal().then((v)=>{
                try{
                    expect(v).to.equal(3)
                    expect(app.repliq.field.valueOf()).to.equal(3)
                    app.kill()
                    done()
                }
                catch(e){
                    app.kill()
                    done(e)
                }
            })
        },2000)
    })
})