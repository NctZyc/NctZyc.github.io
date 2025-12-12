(function () {
  'use strict';

  // ======================
  // 工具函数
  // ======================
  function Random(min, max) {
    return Math.round(Math.random() * (max - min)) + min;
  }

  function getThemeChecked() {
	return getStorageItem('themeChecked');
  }

  function setThemeChecked(theme) {
    setStorageItem('themeChecked', theme);
  }

  /**
   * 根据当前时间返回适合文件命名的时间段字符串
   */
  function getCurrentTimePeriodForFilename() {
    const now = new Date();
    const totalMinutes = now.getHours() * 60 + now.getMinutes();

    const periods = [
      { start: 22 * 60,     end: 24 * 60,     label: "late_night" },
      { start: 0,           end: 1 * 60,      label: "late_night" },
      { start: 1 * 60,      end: 5 * 60,      label: "early_morning" },
      { start: 5 * 60,      end: 6 * 60,      label: "dawn" },
      { start: 6 * 60,      end: 8 * 60,      label: "morning" },
      { start: 8 * 60,      end: 11 * 60 + 30, label: "late_morning" },
      { start: 11 * 60 + 30, end: 13 * 60 + 30, label: "noon" },
      { start: 13 * 60 + 30, end: 18 * 60,     label: "afternoon" },
      { start: 18 * 60,     end: 19 * 60 + 30, label: "evening" },
      { start: 19 * 60 + 30, end: 22 * 60,     label: "night" }
    ];

    for (const period of periods) {
      if (totalMinutes >= period.start && totalMinutes < period.end) {
        return period.label;
      }
    }
    return "unknown";
  }

  // ======================
  // 主题与背景控制
  // ======================
  let leafStyleElement = document.getElementById('dynamic-leaf-style');
  if (!leafStyleElement) {
    leafStyleElement = document.createElement('style');
    leafStyleElement.id = 'dynamic-leaf-style';
    document.head.appendChild(leafStyleElement);
  }

  function changeBg(themeChecked) {
    const imgNum = Random(1, 3);
    const bgDiv = document.getElementById('bg_div');
    if (!bgDiv) {
      console.warn('#bg_div not found');
      return;
    }

    let imgName = '';
    let bgPath = '';

    switch (themeChecked) {
      case "spring":
        imgName = `Lucky_Clover${imgNum}`;
        bgPath = `/style/themeImg/bg/spring-`;
        break;
      case "summer":
        imgName = `Summer${imgNum}`;
        bgPath = `/style/themeImg/bg/summer-`;
        break;
      case "fall":
        imgName = `Maple_Leaf${imgNum}`;
        bgPath = `/style/themeImg/bg/fall-`;
        break;
      case "winter":
        imgName = `SnowFlake${imgNum}`;
        bgPath = `/style/themeImg/bg/winter-`;
        break;
      default:
        return;
    }

    // 更新叶子样式
    leafStyleElement.textContent = `.leaf-scene div {
      background: url(/style/themeImg/${imgName}.png) no-repeat;
      background-size: 100%;
      width: 32px;
      height: 32px;
      position: absolute;
      top: 0;
      left: 0;
      will-change: transform;
    }`;

    // 更新背景
    const timePeriod = getCurrentTimePeriodForFilename();
    bgDiv.style.backgroundImage = `url(${bgPath}${timePeriod}.png)`;
  }

  function ThemeInit() {
    let themeChecked = getThemeChecked();
    const currentMonth = new Date().getMonth() + 1;

    if (!themeChecked) {
      if (currentMonth >= 2 && currentMonth <= 4) {
        themeChecked = "spring";
      } else if (currentMonth >= 5 && currentMonth <= 7) {
        themeChecked = "summer";
      } else if (currentMonth >= 8 && currentMonth <= 10) {
        themeChecked = "fall";
      } else {
        themeChecked = "winter";
      }
      setThemeChecked(themeChecked);
    }

    changeBg(themeChecked);
  }

  // ======================
  // 落叶动画核心
  // ======================
  function LeafScene(el) {
    this.viewport = el;
    this.world = document.createElement('div');
    this.leaves = [];

    this.options = {
      numLeaves: /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/.test(navigator.userAgent) ? 8 : 15,
      wind: {
        magnitude: 1.2,
        maxSpeed: 3, // 降低最大风速，更优雅
        duration: 300,
        start: 0,
        speed: null // 动态函数
      }
    };

    this.width = this.viewport.offsetWidth;
    this.height = this.viewport.offsetHeight;
    this.timer = 0;

    // 重置单片叶子
    this._resetLeaf = function (leaf) {
      leaf.x = Random(0, this.width);
      leaf.y = -10;
      leaf.z = Math.random() * 200;

      leaf.rotation.speed = Math.random() * 5;
      const randomAxis = Math.random();
      if (randomAxis > 0.5) {
        leaf.rotation.axis = 'X';
      } else if (randomAxis > 0.25) {
        leaf.rotation.axis = 'Y';
        leaf.rotation.x = Math.random() * 180 + 90;
      } else {
        leaf.rotation.axis = 'Z';
        leaf.rotation.x = Math.random() * 360 - 180;
        leaf.rotation.speed = Math.random() * 3;
      }

      leaf.xSpeedVariation = Math.random() * 0.7 - 0.4;
      leaf.ySpeed = Math.random() + 0.8; // 稍微减慢下落速度，更优雅

      return leaf;
    };

    // 更新单片叶子位置与旋转
    this._updateLeaf = function (leaf) {
      const leafWindSpeed = this.options.wind.speed(this.timer - this.options.wind.start, leaf.y);
      const xSpeed = leafWindSpeed + leaf.xSpeedVariation;
      leaf.x -= xSpeed;
      leaf.y += leaf.ySpeed;
      leaf.rotation.value += leaf.rotation.speed;

      let transform = `translate3d(${leaf.x}px, ${leaf.y}px, ${leaf.z}px) rotate${leaf.rotation.axis}(${leaf.rotation.value}deg)`;
      if (leaf.rotation.axis !== 'X') {
        transform += ` rotateX(${leaf.rotation.x}deg)`;
      }
      leaf.el.style.transform = transform;

      // 飞出视图则重置
      if (leaf.x < -50 || leaf.y > this.height + 50) {
        this._resetLeaf(leaf);
      }
    };

    // 更新风力参数
    this._updateWind = function () {
      if (this.timer === 0 || this.timer > this.options.wind.start + this.options.wind.duration) {
        const prevMag = this.options.wind.magnitude;
        const newMag = Math.random() * this.options.wind.maxSpeed;
        this.options.wind.magnitude = (prevMag + newMag) / 2; // 平滑过渡

        this.options.wind.duration = this.options.wind.magnitude * 80 + (Math.random() * 40 - 20);
        this.options.wind.start = this.timer;
        const screenHeight = this.height;

        this.options.wind.speed = function (t, y) {
          const a = this.magnitude / 2 * (screenHeight - (2 * y) / 3) / screenHeight;
          return a * Math.sin((2 * Math.PI / this.duration) * t + (3 * Math.PI / 2)) + a;
        };
      }
    };
  }

  LeafScene.prototype.init = function () {
    for (let i = 0; i < this.options.numLeaves; i++) {
      const leaf = {
        el: document.createElement('div'),
        x: 0,
        y: 0,
        z: 0,
        rotation: { axis: 'X', value: 0, speed: 0, x: 0 },
        xSpeedVariation: 0,
        ySpeed: 0
      };
      this._resetLeaf(leaf);
      this.leaves.push(leaf);
      this.world.appendChild(leaf.el);
    }

    this.world.className = 'leaf-scene';
    this.viewport.appendChild(this.world);

    // 设置 3D 透视
    this.world.style.perspective = "400px";

    // 响应窗口大小变化
    const self = this;
    window.addEventListener('resize', function () {
      self.width = self.viewport.offsetWidth;
      self.height = self.viewport.offsetHeight;
      self.leaves.forEach(leaf => self._resetLeaf(leaf));
    });
  };

  LeafScene.prototype.render = function () {
    this._updateWind();
    for (let i = 0; i < this.leaves.length; i++) {
      this._updateLeaf(this.leaves[i]);
    }
    this.timer++;
    requestAnimationFrame(this.render.bind(this));
  };

  // ======================
  // 启动逻辑
  // ======================
function initLeafScene() {
  const leafContainer = document.querySelector('.falling-leaves');
  if (!leafContainer || leafContainer.offsetHeight <= 0) {
    // 如果容器还没高度，稍后再试（防万一）
    setTimeout(initLeafScene, 100);
    return;
  }

  ThemeInit();

  const leaves = new LeafScene(leafContainer);
  leaves.init();
  leaves.render();
}

// 等待所有资源加载完成（包括 CSS 和背景图）
window.addEventListener('load', initLeafScene);

// 也监听 DOMContentLoaded 作为后备（比如纯 HTML/CSS 无大图）
document.addEventListener('DOMContentLoaded', function () {
  // 如果 load 事件因缓存等未触发，DOMContentLoaded 后 300ms 尝试
  setTimeout(initLeafScene, 300);
});
})();