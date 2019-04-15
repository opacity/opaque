const { FuseBox, QuantumPlugin } = require("fuse-box")
const { task, context } = require("fuse-box/sparky")

const
  devDir = "build",
  distDir = "dist"

const createConfig = ({
  name = "index",
  input = "> index.ts",
  isProduction = false,
  outDir = "build",
  target = "browser",
  minify = false,
  watch = false,
}) => async context => {
  context.isProduction = isProduction
  context.outDir = outDir
  context.target = target
  context.minify = minify

  const fuse = context.getConfig()

  if (watch)
    fuse
      .bundle(name)
      .watch()
      .instructions(input)
  else
    fuse
      .bundle(name)
      .instructions(input)

  await fuse.run()
}

context({
  getConfig () {
    return FuseBox.init({
      homeDir: "src",
      output: `${ this.outDir }/$name.js`,
      target: this.target,
      plugins: [
        this.isProduction
          && QuantumPlugin({
            uglify: this.minify && { es6: true }
          })
      ]
    })
  }
})

// default is development
task("default", ["dev"])

// dev builds
task("dev", [
  "&dev:browser",
  "&dev:server"
])

task("dev:browser", createConfig({
  name: "opaque.browser",
  isProduction: false,
  outDir: devDir,
  target: "browser@esnext",
  minify: false
}))

task("dev:server", createConfig({
  name: "opaque.server",
  isProduction: false,
  outDir: devDir,
  target: "server@esnext",
  minify: false
}))

// dev watched builds
task("dev:watch", [
  "&dev:browser:watch",
  "&dev:server:watch"
])

task("dev:browser:watch", createConfig({
  name: "opaque.browser",
  isProduction: false,
  outDir: devDir,
  target: "browser@esnext",
  minify: false,
  watch: true
}))

task("dev:server:watch", createConfig({
  name: "opaque.server",
  isProduction: false,
  outDir: devDir,
  target: "server@esnext",
  minify: false,
  watch: true
}))

// dist builds
task("dist", [
  "&dist:browser:nominify",
  "&dist:browser:minify",
  "&dist:server:nominify",
  "&dist:server:minify"
])

task("dist:browser:nominify", createConfig({
  name: "opaque.browser",
  isProduction: true,
  outDir: distDir,
  target: "browser@es6",
  minify: false
}))

task("dist:browser:minify", createConfig({
  name: "opaque.browser.min",
  isProduction: true,
  outDir: distDir,
  target: "browser@es6",
  minify: true
}))

task("dist:server:nominify", createConfig({
  name: "opaque.server",
  isProduction: true,
  outDir: distDir,
  target: "server@es6",
  minify: false
}))

task("dist:server:minify", createConfig({
  name: "opaque.server.min",
  isProduction: true,
  outDir: distDir,
  target: "server@es6",
  minify: true
}))
