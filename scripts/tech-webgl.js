(function () {
    const canvas = document.getElementById('techCanvas');
    if (!canvas) return;

    const gl = canvas.getContext('webgl2');
    if (!gl) { canvas.style.display = 'none'; return; }

    function resize() {
        const parent = canvas.parentElement;
        canvas.width = parent.offsetWidth;
        canvas.height = parent.offsetHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }

    const vertSrc = `#version 300 es
precision highp float;
in vec4 position;
void main(){ gl_Position = position; }`;

    const fragSrc = `#version 300 es
precision highp float;
out vec4 O;
uniform float time;
uniform vec2 resolution;
#define FC gl_FragCoord.xy
#define R resolution
#define T time
#define S smoothstep
#define N normalize
#define MN min(R.x,R.y)
#define rot(a) mat2(cos(a),-sin(a),sin(a),cos(a))
#define PI radians(180.)

float box(vec3 p, vec3 s, float r){
  p=abs(p)-s+r;
  return length(max(p,.0))+min(.0,max(max(p.x,p.y),p.z))-r;
}

float map(vec3 p){
  p.y=abs(p.y)-2.875;
  p.y-=sin(T*2.-p.z*.25)*2.75;
  p.xz*=rot(PI/4.);
  float d=box(p,vec3(10,.1,10),.005);
  return d*.5;
}

bool march(inout vec3 p, vec3 rd){
  for(int i=0;i++<400;){
    float d=map(p);
    if(abs(d)<1e-2) return true;
    if(d>40.) return false;
    p+=rd*d;
  }
  return false;
}

vec3 norm(vec3 p){
  float h=1e-2; vec2 k=vec2(-1,1);
  return N(k.xyy*map(p+k.xyy*h)+k.yxy*map(p+k.yxy*h)+k.yyx*map(p+k.yyx*h)+k.xxx*map(p+k.xxx*h));
}

float shadow(vec3 p, vec3 lp){
  float shd=1., maxd=length(lp-p);
  vec3 l=N(lp-p);
  for(float i=1e-2;i<maxd;){
    float d=map(p+l*i);
    if(abs(d)<1e-2){shd=.0;break;}
    shd=min(shd,128.*d/i);
    i+=d;
  }
  return shd;
}

float calcAO(vec3 p, vec3 n){
  float occ=.0,sca=1.;
  for(float i=.0;i<5.;i++){
    float h=.01+i*.09,d=map(p+h*n);
    occ+=(h-d)*sca;
    sca*=.55;
    if(occ>.35) break;
  }
  return clamp(1.-3.*occ,.0,1.)*(.5+.5*n.y);
}

vec3 roseBlend(float t){
  vec3 a=vec3(0.969,0.82,0.878);
  vec3 b=vec3(0.816,0.200,0.376);
  return mix(a,b,t);
}

vec3 render(vec2 uv){
  vec3 col=vec3(0.99,0.96,0.97),
  p=vec3(0,0,-30),
  rd=N(vec3(uv,1));
  if(march(p,rd)){
    col=vec3(1);
    vec3 n=norm(p),lp=vec3(0,10,-20),l=N(lp-p);
    float dif=clamp(dot(l,n),.0,1.),ao=calcAO(p,n),
    shd=shadow(p+n*5e-2,lp),spe=pow(clamp(dot(reflect(rd,n),l),.0,1.),15.),
    fre=pow(clamp(1.+dot(rd,n),.0,1.),5.);
    col=roseBlend(dif*shd*ao);
    col=mix(spe*vec3(1,0.8,0.87),col,fre);
    col=tanh(col*col);
    col=pow(col,vec3(.4545));
  }
  return col;
}

void main(){
  vec2 uv=(FC-.5*R)/MN;
  vec3 col=render(uv);
  for(float x=.0;x<=1.;x++){
    for(float y=.0;y<=1.;y++)
      col+=render(uv+(vec2(x,y)-.5)/R);
  }
  col/=5.;
  col=S(1.2,-.2,col);
  O=vec4(col,1);
}`;

    function compileShader(type, src) {
        const sh = gl.createShader(type);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        return sh;
    }

    const vs = compileShader(gl.VERTEX_SHADER, vertSrc);
    const fs = compileShader(gl.FRAGMENT_SHADER, fragSrc);
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(prog, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'resolution');
    const uTime = gl.getUniformLocation(prog, 'time');

    let started = false;
    const observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && !started) {
            started = true;
            loop(0);
        }
    }, { threshold: 0.1 });
    observer.observe(canvas);

    resize();
    window.addEventListener('resize', resize);

    function loop(now) {
        gl.clearColor(0.99, 0.965, 0.972, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(prog);
        gl.uniform2f(uRes, canvas.width, canvas.height);
        gl.uniform1f(uTime, now * 1e-3);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        requestAnimationFrame(loop);
    }
})();
