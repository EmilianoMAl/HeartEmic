(function () {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;

  const glm = window.glMatrix;
  if (!glm) return;

  const { vec3, mat4 } = glm;
  const ctx = canvas.getContext('2d');
  let width = 0, height = 0, scale = 1;

  function resize() {
    const parent = canvas.parentElement;
    width = parent.offsetWidth;
    height = parent.offsetHeight;
    canvas.width = width;
    canvas.height = height;
  }

  const scene = {
    time: 0,
    timeDelta: 1 / 60,
    nodes: [],
    links: [],
    linkByNodePair: {},
    nextId: 1,
    lastNodeTriggerTime: -60,

    getNextId() { return this.nextId++; },

    genNodes() {
      this.nodes.length = 0;
      const q = 8;
      const s = 0.45;
      const zones = [
        { pos: [-0.2, 0, 0.25], r: 0.23 },
        { pos: [+0.2, 0, 0.25], r: 0.23 },
        { pos: [0, 0, 0], r: 0.18 },
      ];
      zones.forEach(z => {
        z.r *= q / 2;
        z.pos[0] = z.pos[0] / 2 * q;
        z.pos[1] = 0.5;
        z.pos[2] = (z.pos[2] + 0.5) / 2 * q;
      });

      for (let depth = 0; depth < 2; depth++) {
        for (let row = 0; row < q; row += 0.5) {
          for (let col = 0; col < q; col += 0.5) {
            const node = { id: this.getNextId(), pos: vec3.create(), baseR: 0.1, charge: 0.1, lastLinkTime: 0 };
            node.pos[0] = (col - q / 2 + Math.random() * 0.5) * s;
            node.pos[2] = (row + Math.random() * 0.5) * s;
            node.pos[1] = (depth / 2 - 0.5 + (Math.random() - 0.5) * 0.5) * (1 - Math.hypot(col - q / 2, row - q / 2) / q * 2);
            let valid = zones.some(z => vec3.dist(z.pos, node.pos) < z.r);
            if (valid) this.nodes.push(node);
          }
        }
      }
    },

    cycle() {
      this.time += this.timeDelta;
      this.processNodes();
      this.processLinks();
    },

    processNodes() {
      const elapsed = this.time - this.lastNodeTriggerTime;
      if (elapsed > 60 / 80) {
        this.lastNodeTriggerTime = this.time;
        for (let i = 0; i < 2; i++) {
          const node = this.nodes[Math.floor(Math.random() * this.nodes.length)];
          if (node) {
            node.charge += 3 + 8 * Math.random();
            const link = {
              startPos: vec3.fromValues(0, 1, 0),
              endPos: vec3.clone(node.pos),
              color: roseColor(this.time, node.id),
              startTime: this.time,
              endTime: this.time + 1,
              index: -1,
            };
            this.links.push(link);
          }
        }
      }
      for (let i = 0; i < this.nodes.length; i++) {
        const n1 = this.nodes[i];
        n1.charge *= 1 - 1 / 30;
        const connected = [];
        for (let j = 0; j < this.nodes.length; j++) {
          if (i === j) continue;
          const n2 = this.nodes[j];
          if (n1.charge + n2.charge > Math.pow(vec3.dist(n1.pos, n2.pos) * 2, 2)) connected.push(n2);
        }
        if (connected.length > 0) {
          connected.push(n1);
          const avg = connected.reduce((s, n) => s + n.charge, 0) / connected.length;
          connected.forEach(n => { n.charge = avg; n.lastLinkTime = this.time; });
          connected.filter(n => n !== n1).forEach(n2 => this.setLink(n1, n2));
        }
      }
    },

    setLink(n1, n2) {
      let a = n1.id, b = n2.id;
      if (a > b) [a, b] = [b, a];
      const idx = a + b * this.nextId;
      let link = this.linkByNodePair[idx];
      if (!link) {
        link = {
          startPos: vec3.clone(n1.pos),
          endPos: vec3.clone(n2.pos),
          color: roseColor(this.time, n1.id),
          startTime: this.time,
          endTime: this.time,
          index: idx,
        };
        this.linkByNodePair[idx] = link;
        this.links.push(link);
      }
      link.endTime = this.time + 2 + Math.random();
      vec3.copy(link.startPos, n1.pos);
      vec3.copy(link.endPos, n2.pos);
    },

    processLinks() {
      for (let i = 0; i < this.links.length; i++) {
        const lk = this.links[i];
        if (this.time >= lk.endTime) {
          this.links.splice(i--, 1);
          if (lk.index !== -1) delete this.linkByNodePair[lk.index];
        }
      }
    },
  };

  function roseColor(time, id) {
    const hue = 340 + 30 * Math.sin(Math.PI * 2 * (time + id / 4) / 1);
    return `hsl(${hue}, 70%, 65%)`;
  }

  scene.genNodes();

  const mVP = mat4.create();
  const tPos1 = vec3.create();
  const tPos2 = vec3.create();

  function project(pos, out) {
    vec3.transformMat4(out, pos, mVP);
  }

  function applyCamera() {
    const a = Math.PI * 2 * scene.time / 4;
    const r = 5;
    const mProj = mat4.create();
    mat4.perspectiveNO(mProj, Math.PI / 2, 1, 1, 100);
    const mView = mat4.create();
    mat4.lookAt(mView, [Math.cos(a) * r, Math.sin(a) * r, 3], [0, 0, 3], [0, 0, 1]);

    mat4.identity(mVP);
    mat4.translate(mVP, mVP, [width / 2, height / 2, 0]);
    const s = Math.min(width, height);
    mat4.scale(mVP, mVP, [s, -s, s]);
    mat4.multiply(mVP, mVP, mProj);
    mat4.multiply(mVP, mVP, mView);
  }

  function render() {
    ctx.clearRect(0, 0, width, height);
    scene.cycle();
    applyCamera();

    ctx.lineWidth = 0.7;
    for (const node of scene.nodes) {
      project(node.pos, tPos1);
      if (tPos1[2] < 0) continue;
      const hue = 340 + 30 * Math.sin(Math.PI * 2 * (scene.time + node.id / 2));
      ctx.strokeStyle = `hsl(${hue}, 75%, 60%)`;
      ctx.beginPath();
      ctx.arc(tPos1[0], tPos1[1], node.baseR * Math.pow(node.charge, 0.5) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.lineWidth = 1;
    for (const lk of scene.links) {
      const rem = Math.pow((lk.endTime - scene.time) / 1, 2);
      ctx.globalAlpha = Math.min(rem, 0.85);
      project(lk.startPos, tPos1);
      project(lk.endPos, tPos2);
      if (tPos1[2] < 0 || tPos2[2] < 0) continue;
      ctx.strokeStyle = lk.color;
      ctx.beginPath();
      ctx.moveTo(tPos1[0], tPos1[1]);
      ctx.lineTo(tPos2[0], tPos2[1]);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(render);
  }

  resize();
  window.addEventListener('resize', resize);
  render();
})();
