import * as THREE from 'three';

(function () {
    'use strict';

    const ForestRunnerThree = {
        scene: null,
        camera: null,
        renderer: null,
        clock: null,
        mount: null,
        running: false,
        paused: false,
        gameOver: false,
        score: 0,
        distance: 0,
        coins: 0,
        speed: 18,
        maxSpeed: 34,
        shieldTimer: 0,
        spawnTimer: 0,
        coinTimer: 0,
        shakeTimer: 0,
        flashTimer: 0,
        trackSegments: [],
        trees: [],
        clouds: [],
        obstacles: [],
        coinItems: [],
        particles: [],
        player: {
            group: null,
            model: {},
            lane: 1,
            targetLane: 1,
            x: 0,
            y: 0,
            groundY: 0.62,
            baseY: 0.62,
            jumpHeight: 0,
            verticalVelocity: 0,
            vy: 0,
            isJumping: false,
            isGrounded: true,
            runPhase: 0,
            landingSquash: 0
        },
        dom: {}
    };

    const LANES = [-2.7, 0, 2.7];
    const PLAYER_Z = 0;
    const SPAWN_Z = -86;
    const REMOVE_Z = 9;
    const COLLISION_Z_MIN = -0.78;
    const COLLISION_Z_MAX = 0.95;
    const DEBUG_COLLISION = false;
    const OBSTACLE_TYPES = {
        stump: { label: '树桩', height: 0.95, canJumpOver: true, requiredJumpHeight: 0.72, radius: 0.56, depth: 0.9 },
        rock: { label: '石头', height: 0.82, canJumpOver: true, requiredJumpHeight: 0.82, radius: 0.62, depth: 0.88 },
        crate: { label: '木箱', height: 1.55, canJumpOver: false, requiredJumpHeight: 2.8, radius: 0.82, depth: 1.04 }
    };

    function cacheDom() {
        ForestRunnerThree.mount = document.getElementById('threeWebglMount');
        ForestRunnerThree.dom.stage = document.getElementById('threeStage');
        ForestRunnerThree.dom.score = document.getElementById('threeScore');
        ForestRunnerThree.dom.distance = document.getElementById('threeDistance');
        ForestRunnerThree.dom.coins = document.getElementById('threeCoins');
        ForestRunnerThree.dom.speed = document.getElementById('threeSpeed');
        ForestRunnerThree.dom.startOverlay = document.getElementById('threeStartOverlay');
        ForestRunnerThree.dom.pauseOverlay = document.getElementById('threePauseOverlay');
        ForestRunnerThree.dom.overOverlay = document.getElementById('threeOverOverlay');
        ForestRunnerThree.dom.pauseBtn = document.getElementById('threePauseBtn');
        ForestRunnerThree.dom.finalScore = document.getElementById('threeFinalScore');
        ForestRunnerThree.dom.finalDistance = document.getElementById('threeFinalDistance');
        ForestRunnerThree.dom.finalCoins = document.getElementById('threeFinalCoins');
        ForestRunnerThree.dom.finalSpeed = document.getElementById('threeFinalSpeed');
        ForestRunnerThree.dom.finalNote = document.getElementById('threeFinalNote');

        document.getElementById('threeStartBtn').addEventListener('click', startGame);
        document.getElementById('threeRestartBtn').addEventListener('click', restartGame);
        document.getElementById('threeResetBtn').addEventListener('click', restartGame);
        document.getElementById('threeResumeBtn').addEventListener('click', togglePause);
        document.getElementById('threePauseRestartBtn').addEventListener('click', restartGame);
        ForestRunnerThree.dom.pauseBtn.addEventListener('click', togglePause);
    }

    function initScene() {
        const mount = ForestRunnerThree.mount;
        if (!isWebGLAvailable()) {
            showWebGLError();
            return false;
        }

        ForestRunnerThree.scene = new THREE.Scene();
        ForestRunnerThree.scene.background = new THREE.Color(0x9bd8f5);
        ForestRunnerThree.scene.fog = new THREE.Fog(0x9bd8f5, 34, 105);

        ForestRunnerThree.camera = new THREE.PerspectiveCamera(58, 16 / 9, 0.1, 180);
        ForestRunnerThree.camera.position.set(0, 5.4, 9.4);
        ForestRunnerThree.camera.lookAt(0, 1.4, -14);

        ForestRunnerThree.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false,
            preserveDrawingBuffer: true
        });
        ForestRunnerThree.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        ForestRunnerThree.renderer.shadowMap.enabled = true;
        ForestRunnerThree.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        mount.appendChild(ForestRunnerThree.renderer.domElement);

        ForestRunnerThree.clock = new THREE.Clock();
        addLights();
        createTrack();
        createForest();
        createSkyDetails();
        createPlayer();
        resizeRenderer();
        window.addEventListener('resize', resizeRenderer);
        return true;
    }

    function isWebGLAvailable() {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (error) {
            return false;
        }
    }

    function showWebGLError() {
        ForestRunnerThree.mount.innerHTML = '<div class="three-run-error"><div><h2>当前浏览器不支持 WebGL</h2><p>请使用支持 WebGL 的现代浏览器打开 Three.js 实验版。</p></div></div>';
    }

    function addLights() {
        const hemi = new THREE.HemisphereLight(0xeaffff, 0x245236, 2.2);
        ForestRunnerThree.scene.add(hemi);

        const sun = new THREE.DirectionalLight(0xfff0bd, 3.2);
        sun.position.set(-6, 12, 7);
        sun.castShadow = true;
        sun.shadow.mapSize.set(1024, 1024);
        sun.shadow.camera.near = 1;
        sun.shadow.camera.far = 60;
        sun.shadow.camera.left = -18;
        sun.shadow.camera.right = 18;
        sun.shadow.camera.top = 18;
        sun.shadow.camera.bottom = -18;
        ForestRunnerThree.scene.add(sun);
    }

    function createTrack() {
        const grass = new THREE.Mesh(
            new THREE.PlaneGeometry(90, 150),
            new THREE.MeshLambertMaterial({ color: 0x3f8a46 })
        );
        grass.rotation.x = -Math.PI / 2;
        grass.position.set(0, 0, -35);
        grass.receiveShadow = true;
        ForestRunnerThree.scene.add(grass);

        const roadMaterialA = new THREE.MeshStandardMaterial({ color: 0x7b5632, roughness: 0.92 });
        const roadMaterialB = new THREE.MeshStandardMaterial({ color: 0x6b482a, roughness: 0.95 });
        for (let i = 0; i < 18; i += 1) {
            const segment = new THREE.Mesh(
                new THREE.BoxGeometry(8.8, 0.08, 8.2),
                i % 2 === 0 ? roadMaterialA : roadMaterialB
            );
            segment.position.set(0, 0.035, -i * 8);
            segment.receiveShadow = true;
            ForestRunnerThree.scene.add(segment);
            ForestRunnerThree.trackSegments.push(segment);
        }

        const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xf5dfa2 });
        [-1.35, 1.35].forEach((x) => {
            const line = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 145), lineMaterial);
            line.position.set(x, 0.095, -35);
            ForestRunnerThree.scene.add(line);
        });
    }

    function createForest() {
        for (let i = 0; i < 54; i += 1) {
            const side = i % 2 === 0 ? -1 : 1;
            const z = -4 - (i * 3.1) % 88;
            const x = side * (6.4 + Math.random() * 9);
            const tree = createTree();
            tree.position.set(x, 0, z);
            tree.userData.speedLayer = Math.abs(x) > 10 ? 0.7 : 1.05;
            ForestRunnerThree.scene.add(tree);
            ForestRunnerThree.trees.push(tree);
        }
    }

    function createTree() {
        const group = new THREE.Group();
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.16, 0.24, 1.9, 8),
            new THREE.MeshStandardMaterial({ color: 0x6b3f24, roughness: 0.86 })
        );
        trunk.position.y = 0.95;
        trunk.castShadow = true;
        group.add(trunk);

        const crownColor = Math.random() > 0.5 ? 0x1f7145 : 0x2b8f52;
        for (let i = 0; i < 3; i += 1) {
            const crown = new THREE.Mesh(
                new THREE.ConeGeometry(0.95 - i * 0.12, 1.35, 8),
                new THREE.MeshStandardMaterial({ color: crownColor, roughness: 0.8 })
            );
            crown.position.y = 1.9 + i * 0.58;
            crown.castShadow = true;
            group.add(crown);
        }
        const scale = 0.82 + Math.random() * 0.62;
        group.scale.setScalar(scale);
        return group;
    }

    function createSkyDetails() {
        const sun = new THREE.Mesh(
            new THREE.SphereGeometry(2.2, 24, 16),
            new THREE.MeshBasicMaterial({ color: 0xffdf75 })
        );
        sun.position.set(-16, 20, -45);
        ForestRunnerThree.scene.add(sun);

        for (let i = 0; i < 6; i += 1) {
            const cloud = new THREE.Group();
            const material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.76 });
            for (let j = 0; j < 4; j += 1) {
                const puff = new THREE.Mesh(new THREE.SphereGeometry(0.9 + Math.random() * 0.5, 12, 8), material);
                puff.position.set(j * 1.1, Math.random() * 0.35, Math.random() * 0.2);
                puff.scale.y = 0.55;
                cloud.add(puff);
            }
            cloud.position.set(-18 + i * 7.5, 13 + Math.random() * 5, -35 - Math.random() * 40);
            ForestRunnerThree.scene.add(cloud);
            ForestRunnerThree.clouds.push(cloud);
        }
    }

    function createPlayer() {
        const model = createPlayerModel();
        model.group.position.set(0, ForestRunnerThree.player.groundY, PLAYER_Z);
        model.group.rotation.y = Math.PI;
        ForestRunnerThree.scene.add(model.group);
        ForestRunnerThree.scene.add(model.shadow);
        ForestRunnerThree.player.group = model.group;
        ForestRunnerThree.player.model = model;
    }

    function createPlayerModel() {
        const group = new THREE.Group();
        const orange = new THREE.MeshStandardMaterial({ color: 0xd86b28, roughness: 0.72, flatShading: true });
        const orangeDark = new THREE.MeshStandardMaterial({ color: 0xaa451d, roughness: 0.78, flatShading: true });
        const white = new THREE.MeshStandardMaterial({ color: 0xffead2, roughness: 0.74, flatShading: true });
        const dark = new THREE.MeshStandardMaterial({ color: 0x2d1a14, roughness: 0.8, flatShading: true });
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x17110d });
        const model = { group, legs: [], ears: [] };

        const body = new THREE.Mesh(new THREE.SphereGeometry(0.62, 12, 9), orange);
        body.scale.set(0.86, 1.0, 0.7);
        body.position.y = 0.9;
        body.castShadow = true;
        group.add(body);
        model.body = body;

        const belly = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), white);
        belly.scale.set(0.74, 0.95, 0.18);
        belly.position.set(0, 0.86, 0.46);
        group.add(belly);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 9), orange);
        head.scale.set(1.02, 0.94, 0.9);
        head.position.set(0, 1.48, 0.1);
        head.castShadow = true;
        group.add(head);
        model.head = head;

        [-0.24, 0.24].forEach((x) => {
            const ear = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.48, 4), orangeDark);
            ear.position.set(x, 1.9, 0.02);
            ear.rotation.set(0.05, 0, x < 0 ? 0.28 : -0.28);
            ear.castShadow = true;
            group.add(ear);
            model.ears.push(ear);
        });

        const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), white);
        muzzle.scale.set(0.9, 0.62, 0.58);
        muzzle.position.set(0, 1.4, 0.48);
        group.add(muzzle);

        [-0.13, 0.13].forEach((x) => {
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), eyeMat);
            eye.position.set(x, 1.53, 0.48);
            group.add(eye);
        });

        const nose = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), dark);
        nose.position.set(0, 1.4, 0.6);
        group.add(nose);

        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.36, 1.45, 12), orange);
        tail.position.set(-0.72, 0.95, -0.25);
        tail.rotation.set(0.28, 0.15, -1.18);
        tail.castShadow = true;
        group.add(tail);
        model.tail = tail;

        const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), white);
        tailTip.scale.set(1.1, 0.82, 0.82);
        tailTip.position.set(-1.24, 1.16, -0.47);
        group.add(tailTip);
        model.tailTip = tailTip;

        [
            [-0.28, 0.2, 1],
            [0.28, 0.2, -1],
            [-0.26, -0.2, -1],
            [0.26, -0.2, 1]
        ].forEach(([x, z, side]) => {
            const leg = new THREE.Group();
            const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.095, 0.44, 7), dark);
            upper.position.y = 0.27;
            upper.castShadow = true;
            leg.add(upper);
            const paw = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), dark);
            paw.scale.set(0.95, 0.48, 1.28);
            paw.position.set(0, 0.02, 0.05);
            paw.castShadow = true;
            leg.add(paw);
            leg.position.set(x, 0.08, z);
            leg.userData.side = side;
            group.add(leg);
            model.legs.push(leg);
        });

        const shadow = new THREE.Mesh(
            new THREE.CircleGeometry(0.78, 24),
            new THREE.MeshBasicMaterial({ color: 0x14301f, transparent: true, opacity: 0.28, depthWrite: false })
        );
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.set(0, 0.105, PLAYER_Z + 0.12);
        model.shadow = shadow;

        return model;
    }

    function createObstacle() {
        const typeKeys = Object.keys(OBSTACLE_TYPES);
        const type = typeKeys[Math.floor(Math.random() * typeKeys.length)];
        const lane = Math.floor(Math.random() * 3);
        const group = new THREE.Group();

        if (type === 'stump') {
            const stump = new THREE.Mesh(
                new THREE.CylinderGeometry(0.48, 0.56, 1.05, 14),
                new THREE.MeshStandardMaterial({ color: 0x7a482a, roughness: 0.88 })
            );
            stump.position.y = 0.55;
            stump.castShadow = true;
            group.add(stump);

            const top = new THREE.Mesh(
                new THREE.CylinderGeometry(0.44, 0.44, 0.05, 14),
                new THREE.MeshStandardMaterial({ color: 0xd0a06a, roughness: 0.92 })
            );
            top.position.y = 1.1;
            group.add(top);
        } else if (type === 'rock') {
            const rock = new THREE.Mesh(
                new THREE.DodecahedronGeometry(0.72, 0),
                new THREE.MeshStandardMaterial({ color: 0x7d837c, roughness: 0.9 })
            );
            rock.position.y = 0.55;
            rock.scale.set(1.05, 0.72, 0.9);
            rock.rotation.set(0.2, Math.random() * Math.PI, -0.16);
            rock.castShadow = true;
            group.add(rock);
        } else {
            const crate = new THREE.Mesh(
                new THREE.BoxGeometry(1.35, 1.35, 1.2),
                new THREE.MeshStandardMaterial({ color: 0x9a6539, roughness: 0.82 })
            );
            crate.position.y = 0.72;
            crate.castShadow = true;
            group.add(crate);

            const bandMaterial = new THREE.MeshBasicMaterial({ color: 0x4b2d1d });
            const band = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.12, 1.26), bandMaterial);
            band.position.y = 0.95;
            group.add(band);
        }

        group.position.set(LANES[lane], 0, SPAWN_Z);
        group.userData = {
            lane,
            type,
            resolved: false,
            passed: false,
            ...OBSTACLE_TYPES[type]
        };
        ForestRunnerThree.scene.add(group);
        ForestRunnerThree.obstacles.push(group);
    }

    function createCoin() {
        const blocked = new Set(ForestRunnerThree.obstacles.filter((obstacle) => obstacle.position.z < -55).map((obstacle) => obstacle.userData.lane));
        const lanes = [0, 1, 2].filter((lane) => !blocked.has(lane));
        const lane = lanes.length ? lanes[Math.floor(Math.random() * lanes.length)] : Math.floor(Math.random() * 3);
        const coin = new THREE.Mesh(
            new THREE.TorusGeometry(0.34, 0.08, 10, 22),
            new THREE.MeshStandardMaterial({ color: 0xffd447, metalness: 0.25, roughness: 0.28, emissive: 0x6d4a00 })
        );
        coin.position.set(LANES[lane], 1.25, SPAWN_Z - 3 - Math.random() * 10);
        coin.rotation.y = Math.PI / 2;
        coin.castShadow = true;
        coin.userData = { lane, collected: false };
        ForestRunnerThree.scene.add(coin);
        ForestRunnerThree.coinItems.push(coin);
    }

    function resetGame() {
        ForestRunnerThree.running = false;
        ForestRunnerThree.paused = false;
        ForestRunnerThree.gameOver = false;
        ForestRunnerThree.score = 0;
        ForestRunnerThree.distance = 0;
        ForestRunnerThree.coins = 0;
        ForestRunnerThree.speed = 18;
        ForestRunnerThree.shieldTimer = 0;
        ForestRunnerThree.spawnTimer = 0.45;
        ForestRunnerThree.coinTimer = 0.7;
        ForestRunnerThree.shakeTimer = 0;
        ForestRunnerThree.flashTimer = 0;
        clearObjects(ForestRunnerThree.obstacles);
        clearObjects(ForestRunnerThree.coinItems);
        clearObjects(ForestRunnerThree.particles);
        ForestRunnerThree.player.lane = 1;
        ForestRunnerThree.player.targetLane = 1;
        ForestRunnerThree.player.x = 0;
        ForestRunnerThree.player.y = 0;
        ForestRunnerThree.player.jumpHeight = 0;
        ForestRunnerThree.player.verticalVelocity = 0;
        ForestRunnerThree.player.vy = 0;
        ForestRunnerThree.player.isGrounded = true;
        ForestRunnerThree.player.isJumping = false;
        ForestRunnerThree.player.landingSquash = 0;
        if (ForestRunnerThree.player.group) {
            ForestRunnerThree.player.group.position.set(0, ForestRunnerThree.player.groundY, PLAYER_Z);
            ForestRunnerThree.player.group.scale.set(1, 1, 1);
        }
        if (ForestRunnerThree.player.model.shadow) {
            ForestRunnerThree.player.model.shadow.position.set(0, 0.105, PLAYER_Z + 0.12);
            ForestRunnerThree.player.model.shadow.scale.set(1, 0.72, 1);
            ForestRunnerThree.player.model.shadow.material.opacity = 0.28;
        }
        ForestRunnerThree.dom.pauseBtn.disabled = true;
        ForestRunnerThree.dom.pauseBtn.textContent = '暂停';
        updateHUD();
    }

    function clearObjects(list) {
        list.forEach((object) => {
            ForestRunnerThree.scene.remove(object);
        });
        list.length = 0;
    }

    function startGame() {
        if (ForestRunnerThree.gameOver) {
            resetGame();
        }
        ForestRunnerThree.running = true;
        ForestRunnerThree.paused = false;
        ForestRunnerThree.dom.startOverlay.classList.add('three-run-hidden');
        ForestRunnerThree.dom.pauseOverlay.classList.add('three-run-hidden');
        ForestRunnerThree.dom.overOverlay.classList.add('three-run-hidden');
        ForestRunnerThree.dom.pauseBtn.disabled = false;
    }

    function restartGame() {
        resetGame();
        startGame();
    }

    function togglePause() {
        if (!ForestRunnerThree.running || ForestRunnerThree.gameOver) {
            return;
        }
        ForestRunnerThree.paused = !ForestRunnerThree.paused;
        ForestRunnerThree.dom.pauseBtn.textContent = ForestRunnerThree.paused ? '继续' : '暂停';
        ForestRunnerThree.dom.pauseOverlay.classList.toggle('three-run-hidden', !ForestRunnerThree.paused);
    }

    function endGame() {
        ForestRunnerThree.gameOver = true;
        ForestRunnerThree.running = false;
        ForestRunnerThree.shakeTimer = 0.42;
        ForestRunnerThree.flashTimer = 0.35;
        ForestRunnerThree.dom.pauseBtn.disabled = true;
        ForestRunnerThree.dom.finalScore.textContent = Math.floor(ForestRunnerThree.score).toString();
        ForestRunnerThree.dom.finalDistance.textContent = `${Math.floor(ForestRunnerThree.distance)}m`;
        ForestRunnerThree.dom.finalCoins.textContent = ForestRunnerThree.coins.toString();
        ForestRunnerThree.dom.finalSpeed.textContent = `${(ForestRunnerThree.speed / 18).toFixed(1)}x`;
        ForestRunnerThree.dom.finalNote.textContent = ForestRunnerThree.coins >= 8 ? '金币路线不错，下一步可以验证更复杂的 3D 关卡节奏。' : '基础 3D 跑酷链路已打通，仍可继续优化模型和关卡密度。';
        ForestRunnerThree.dom.overOverlay.classList.remove('three-run-hidden');
    }

    function updatePlayer(dt) {
        updateLaneSwitch(dt);
        updatePlayerJump(dt);
        updatePlayerAnimation(dt);
    }

    function updateLaneSwitch(dt) {
        const player = ForestRunnerThree.player;
        const targetX = LANES[player.targetLane];
        player.x += (targetX - player.x) * Math.min(1, dt * 12);
        if (Math.abs(player.x - targetX) < 0.04) {
            player.x = targetX;
            player.lane = player.targetLane;
        }
    }

    function updatePlayerJump(dt) {
        const player = ForestRunnerThree.player;
        if (player.jumpHeight > 0 || player.verticalVelocity > 0) {
            const wasAirborne = !player.isGrounded;
            player.jumpHeight += player.verticalVelocity * dt;
            player.verticalVelocity -= 18.4 * dt;
            if (player.jumpHeight <= 0) {
                player.jumpHeight = 0;
                player.verticalVelocity = 0;
                player.vy = 0;
                player.isGrounded = true;
                player.isJumping = false;
                if (wasAirborne) {
                    player.landingSquash = 1;
                    spawnParticles(0xe8c58a, player.group.position, 6);
                }
            } else {
                player.isGrounded = false;
                player.isJumping = true;
                player.vy = player.verticalVelocity;
            }
        }
    }

    function updatePlayerAnimation(dt) {
        const player = ForestRunnerThree.player;
        const model = player.model || {};
        const targetX = LANES[player.targetLane];
        const moving = ForestRunnerThree.running && !ForestRunnerThree.paused && !ForestRunnerThree.gameOver;
        if (moving && player.isGrounded) {
            player.runPhase += dt * ForestRunnerThree.speed * 1.1;
        }

        player.landingSquash = Math.max(0, player.landingSquash - dt * 6);
        const runWave = Math.sin(player.runPhase);
        const bob = moving && player.isGrounded ? runWave * 0.055 : 0;
        const squashY = 1 - player.landingSquash * 0.12;
        const squashX = 1 + player.landingSquash * 0.08;
        player.y = player.groundY + player.jumpHeight + bob;
        player.group.position.set(player.x, player.y, PLAYER_Z);
        player.group.scale.set(squashX, squashY, squashX);
        player.group.rotation.z = (targetX - player.x) * -0.1;
        player.group.rotation.x = player.isJumping ? -0.14 + player.verticalVelocity * 0.011 : 0;

        if (model.body) {
            model.body.rotation.z = moving ? runWave * 0.035 : 0;
        }
        if (model.head) {
            model.head.rotation.x = player.isJumping ? -0.08 : Math.sin(player.runPhase + 0.6) * 0.035;
        }
        if (model.tail) {
            model.tail.rotation.z = -1.18 + Math.sin(player.runPhase * 0.9) * 0.18;
            model.tail.rotation.y = 0.15 + Math.cos(player.runPhase * 0.8) * 0.08;
        }
        if (model.tailTip) {
            model.tailTip.position.y = 1.16 + Math.sin(player.runPhase * 0.9 + 0.4) * 0.08;
        }
        (model.ears || []).forEach((ear, index) => {
            ear.rotation.x = 0.05 + Math.sin(player.runPhase * 0.7 + index) * 0.025;
        });
        (model.legs || []).forEach((leg) => {
            const swing = moving && player.isGrounded ? Math.sin(player.runPhase * 1.85) * 0.78 * leg.userData.side : 0;
            leg.rotation.x = player.isJumping ? 0.28 * leg.userData.side : swing;
        });
        if (model.shadow) {
            model.shadow.position.x = player.x;
            model.shadow.position.z = PLAYER_Z + 0.12;
            const shadowScale = Math.max(0.42, 1 - player.jumpHeight * 0.24);
            model.shadow.scale.set(shadowScale, shadowScale * 0.72, shadowScale);
            model.shadow.material.opacity = 0.28 * shadowScale;
        }
    }

    function updateObstacles(dt) {
        const dz = ForestRunnerThree.speed * dt;
        ForestRunnerThree.obstacles.forEach((obstacle) => {
            obstacle.position.z += dz;
            obstacle.rotation.y += dt * 0.55;
            if (obstacle.position.z > COLLISION_Z_MAX && !obstacle.userData.resolved) {
                obstacle.userData.passed = true;
            }
        });
        ForestRunnerThree.obstacles = ForestRunnerThree.obstacles.filter((obstacle) => {
            const keep = obstacle.position.z < REMOVE_Z;
            if (!keep) {
                ForestRunnerThree.scene.remove(obstacle);
            }
            return keep;
        });
    }

    function updateCoins(dt) {
        const dz = ForestRunnerThree.speed * dt;
        ForestRunnerThree.coinItems.forEach((coin) => {
            coin.position.z += dz;
            coin.rotation.y += dt * 7;
            coin.position.y = 1.25 + Math.sin(performance.now() * 0.004 + coin.position.z) * 0.12;
        });
        ForestRunnerThree.coinItems = ForestRunnerThree.coinItems.filter((coin) => {
            const keep = coin.position.z < REMOVE_Z && !coin.userData.collected;
            if (!keep) {
                ForestRunnerThree.scene.remove(coin);
            }
            return keep;
        });
    }

    function updateWorld(dt) {
        ForestRunnerThree.trackSegments.forEach((segment) => {
            segment.position.z += ForestRunnerThree.speed * dt;
            if (segment.position.z > 8) {
                segment.position.z -= 18 * 8;
            }
        });

        ForestRunnerThree.trees.forEach((tree) => {
            tree.position.z += ForestRunnerThree.speed * dt * tree.userData.speedLayer;
            tree.rotation.z = Math.sin(performance.now() * 0.001 + tree.position.z) * 0.025;
            if (tree.position.z > 10) {
                tree.position.z = -88 - Math.random() * 8;
                tree.position.x = (Math.random() > 0.5 ? -1 : 1) * (6.4 + Math.random() * 9);
            }
        });

        ForestRunnerThree.clouds.forEach((cloud) => {
            cloud.position.x += dt * 0.35;
            if (cloud.position.x > 24) {
                cloud.position.x = -24;
            }
        });
    }

    function updateParticles(dt) {
        ForestRunnerThree.particles.forEach((particle) => {
            particle.position.addScaledVector(particle.userData.velocity, dt);
            particle.userData.life -= dt;
            particle.material.opacity = Math.max(0, particle.userData.life / particle.userData.maxLife);
        });
        ForestRunnerThree.particles = ForestRunnerThree.particles.filter((particle) => {
            const keep = particle.userData.life > 0;
            if (!keep) {
                ForestRunnerThree.scene.remove(particle);
            }
            return keep;
        });
    }

    function checkCollisions() {
        ForestRunnerThree.obstacles.forEach((obstacle) => {
            checkObstacleCollision(obstacle);
        });
        ForestRunnerThree.coinItems.forEach((coin) => {
            checkCoinCollection(coin);
        });
    }

    function checkObstacleCollision(obstacle) {
        const playerState = getPlayerCollisionState();
        if (obstacle.userData.resolved || obstacle.userData.passed || !isObstacleNearPlayer(obstacle)) {
            return false;
        }
        if (obstacle.userData.lane !== playerState.lane) {
            return false;
        }

        if (canPlayerAvoidObstacle(obstacle, playerState)) {
            obstacle.userData.resolved = true;
            ForestRunnerThree.score += 45;
            spawnParticles(0xefffd7, ForestRunnerThree.player.group.position, 10);
            debugCollision('avoid', obstacle, playerState);
            return false;
        }

        if (ForestRunnerThree.shieldTimer > 0) {
            ForestRunnerThree.shieldTimer = 0;
            obstacle.userData.resolved = true;
            obstacle.userData.passed = true;
            ForestRunnerThree.shakeTimer = 0.25;
            spawnParticles(0x88ddff, obstacle.position, 14);
            debugCollision('shield', obstacle, playerState);
            return false;
        }

        obstacle.userData.resolved = true;
        obstacle.userData.passed = true;
        debugCollision('hit', obstacle, playerState);
        endGame();
        return true;
    }

    function getPlayerCollisionState() {
        const player = ForestRunnerThree.player;
        return {
            lane: player.lane,
            targetLane: player.targetLane,
            x: player.group ? player.group.position.x : player.x,
            y: player.group ? player.group.position.y : player.groundY + player.jumpHeight,
            z: PLAYER_Z,
            groundY: player.groundY,
            jumpHeight: player.jumpHeight,
            verticalVelocity: player.verticalVelocity,
            isJumping: player.isJumping,
            isGrounded: player.isGrounded,
            collisionRadiusX: 0.48,
            collisionHeight: 1.2
        };
    }

    function isObstacleNearPlayer(obstacle) {
        const z = obstacle.position.z - PLAYER_Z;
        const near = z >= COLLISION_Z_MIN && z <= COLLISION_Z_MAX;
        if (!near && z > COLLISION_Z_MAX) {
            obstacle.userData.passed = true;
        }
        return near;
    }

    function canPlayerAvoidObstacle(obstacle, playerState) {
        if (obstacle.userData.lane !== playerState.lane) {
            return true;
        }
        if (obstacle.userData.canJumpOver) {
            return playerState.jumpHeight >= obstacle.userData.requiredJumpHeight;
        }
        return false;
    }

    function debugCollision(result, obstacle, playerState) {
        if (!DEBUG_COLLISION) {
            return;
        }
        console.debug('[ForestRunnerThree collision]', {
            result,
            playerLane: playerState.lane,
            playerJumpHeight: Number(playerState.jumpHeight.toFixed(2)),
            playerY: Number(playerState.y.toFixed(2)),
            obstacleLane: obstacle.userData.lane,
            obstacleZ: Number(obstacle.position.z.toFixed(2)),
            obstacleType: obstacle.userData.type,
            inWindow: isObstacleNearPlayer(obstacle),
            canJumpOver: obstacle.userData.canJumpOver,
            requiredJumpHeight: obstacle.userData.requiredJumpHeight,
            passed: obstacle.userData.passed
        });
    }

    function checkCoinCollection(coin) {
        if (coin.userData.collected || coin.userData.lane !== ForestRunnerThree.player.lane) {
            return;
        }
        const nearPlayer = coin.position.z > -1.2 && coin.position.z < 1.35;
        const closeY = Math.abs((ForestRunnerThree.player.groundY + ForestRunnerThree.player.jumpHeight + 0.7) - coin.position.y) < 1.35;
        if (nearPlayer && closeY) {
            coin.userData.collected = true;
            ForestRunnerThree.coins += 1;
            ForestRunnerThree.score += 35;
            spawnParticles(0xffd447, coin.position, 14);
        }
    }

    function spawnParticles(color, origin, count) {
        for (let i = 0; i < count; i += 1) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.055 + Math.random() * 0.035, 8, 6),
                new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 })
            );
            particle.position.copy(origin);
            particle.userData = {
                velocity: new THREE.Vector3((Math.random() - 0.5) * 3, 1 + Math.random() * 3, (Math.random() - 0.5) * 3),
                life: 0.45 + Math.random() * 0.3,
                maxLife: 0.75
            };
            ForestRunnerThree.scene.add(particle);
            ForestRunnerThree.particles.push(particle);
        }
    }

    function updateHUD() {
        ForestRunnerThree.dom.score.textContent = Math.floor(ForestRunnerThree.score).toString();
        ForestRunnerThree.dom.distance.textContent = Math.floor(ForestRunnerThree.distance).toString();
        ForestRunnerThree.dom.coins.textContent = ForestRunnerThree.coins.toString();
        ForestRunnerThree.dom.speed.textContent = `${(ForestRunnerThree.speed / 18).toFixed(1)}x`;
    }

    function updateGame(dt) {
        if (!ForestRunnerThree.running || ForestRunnerThree.paused || ForestRunnerThree.gameOver) {
            return;
        }
        ForestRunnerThree.distance += ForestRunnerThree.speed * dt * 0.9;
        ForestRunnerThree.score += dt * 18;
        ForestRunnerThree.speed = Math.min(ForestRunnerThree.maxSpeed, ForestRunnerThree.speed + dt * 0.22);
        ForestRunnerThree.spawnTimer -= dt;
        ForestRunnerThree.coinTimer -= dt;
        if (ForestRunnerThree.spawnTimer <= 0) {
            createObstacle();
            ForestRunnerThree.spawnTimer = Math.max(0.72, 1.45 - (ForestRunnerThree.speed - 18) * 0.026 + Math.random() * 0.38);
        }
        if (ForestRunnerThree.coinTimer <= 0) {
            createCoin();
            ForestRunnerThree.coinTimer = 0.78 + Math.random() * 0.75;
        }
        updatePlayer(dt);
        updateWorld(dt);
        updateObstacles(dt);
        updateCoins(dt);
        updateParticles(dt);
        checkCollisions();
        updateHUD();
    }

    function renderScene(dt) {
        const camera = ForestRunnerThree.camera;
        const baseX = ForestRunnerThree.player.x * 0.12;
        const shake = ForestRunnerThree.shakeTimer > 0 ? ForestRunnerThree.shakeTimer * 0.18 : 0;
        ForestRunnerThree.shakeTimer = Math.max(0, ForestRunnerThree.shakeTimer - dt);
        ForestRunnerThree.flashTimer = Math.max(0, ForestRunnerThree.flashTimer - dt);
        camera.position.x += (baseX - camera.position.x) * Math.min(1, dt * 5);
        camera.position.y = 5.4 + Math.sin(performance.now() * 0.006) * shake;
        camera.position.z = 9.4 + Math.cos(performance.now() * 0.009) * shake;
        camera.lookAt(ForestRunnerThree.player.x * 0.14, 1.35, -14);
        if (DEBUG_COLLISION) {
            drawDebugHelpers();
        }
        ForestRunnerThree.renderer.render(ForestRunnerThree.scene, ForestRunnerThree.camera);
    }

    function drawDebugHelpers() {
        // 调试开关默认关闭；需要时可在这里添加 BoxHelper 查看碰撞区域。
    }

    function animate() {
        const dt = Math.min(0.05, ForestRunnerThree.clock.getDelta());
        updateGame(dt);
        renderScene(dt);
        window.requestAnimationFrame(animate);
    }

    function moveLane(direction) {
        if (!ForestRunnerThree.running || ForestRunnerThree.paused || ForestRunnerThree.gameOver) {
            return;
        }
        ForestRunnerThree.player.targetLane = clamp(ForestRunnerThree.player.targetLane + direction, 0, 2);
    }

    function jump() {
        const player = ForestRunnerThree.player;
        if (!ForestRunnerThree.running || ForestRunnerThree.paused || ForestRunnerThree.gameOver || !player.isGrounded) {
            return;
        }
        player.verticalVelocity = 9.35;
        player.vy = player.verticalVelocity;
        player.isGrounded = false;
        player.isJumping = true;
        spawnParticles(0xeaffdf, player.group.position, 8);
    }

    function bindKeys() {
        window.addEventListener('keydown', (event) => {
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space'].includes(event.code)) {
                event.preventDefault();
            }
            if (event.repeat) {
                return;
            }
            if (event.code === 'ArrowLeft') {
                moveLane(-1);
            } else if (event.code === 'ArrowRight') {
                moveLane(1);
            } else if (event.code === 'ArrowUp' || event.code === 'Space') {
                jump();
            } else if (event.code === 'KeyP') {
                togglePause();
            }
        });
    }

    function resizeRenderer() {
        const mount = ForestRunnerThree.mount;
        const rect = mount.getBoundingClientRect();
        const width = Math.max(640, Math.floor(rect.width));
        const height = Math.max(360, Math.floor(rect.height));
        ForestRunnerThree.renderer.setSize(width, height, false);
        ForestRunnerThree.camera.aspect = width / height;
        ForestRunnerThree.camera.updateProjectionMatrix();
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function init() {
        cacheDom();
        if (!initScene()) {
            return;
        }
        bindKeys();
        resetGame();
        animate();
    }

    Object.assign(ForestRunnerThree, {
        getPlayerCollisionState,
        isObstacleNearPlayer,
        checkObstacleCollision,
        canPlayerAvoidObstacle,
        updateLaneSwitch,
        updatePlayerJump,
        updatePlayerAnimation
    });

    document.addEventListener('DOMContentLoaded', init);
    window.ForestRunnerThree = ForestRunnerThree;
})();
