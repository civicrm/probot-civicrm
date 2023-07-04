with import <nixpkgs> {};

stdenv.mkDerivation {
    name = "node";
    buildInputs = [
        ## nodejs-10_x would match production, but it doesn't build on darwin-arm64, and Github docs suggest nodejs-16
        nodejs-16_x
    ];
    shellHook = ''
        export PATH="$PWD/node_modules/.bin/:$PATH"
    '';
}
