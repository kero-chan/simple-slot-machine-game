<template>
  <div class="splash-screen">
    <div class="splash-content">
      <div class="splash-tiles">
        <div class="tile"><img src="/dragon_green.png" alt="Green Dragon"></div>
        <div class="tile"><img src="/wild.png" alt="Wild"></div>
        <div class="tile"><img src="/bamboo.png" alt="Bamboo"></div>
        <div class="tile"><img src="/wind_east.png" alt="East Wind"></div>
        <div class="tile"><img src="/wind_south.png" alt="South Wind"></div>
      </div>
      <h1 class="splash-title">麻将胡了</h1>
      <div class="splash-subtitle">MAHJONG WAYS</div>
      <div class="splash-tagline">连消百搭 + 递增倍数 好玩又好赢！</div>
      <button @click="$emit('start')" class="start-button">开始</button>
      <div class="splash-footer">
        <div class="certs">MGA · BMM · RTP</div>
        <div class="copyright">PGSOFT.COM 2025 ©</div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['start'])
</script>

<style scoped>
.splash-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('/start_game_bg.jpg') center/cover no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.splash-content {
  text-align: center;
  color: white;
  padding: 2rem;
  max-width: 600px;
  width: 100%;
}

.splash-tiles {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.tile {
  width: 60px;
  height: 80px;
  background: linear-gradient(145deg, #f0f0f0, #d0d0d0);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  animation: float 3s ease-in-out infinite;
}

.tile:nth-child(1) { animation-delay: 0s; }
.tile:nth-child(2) { animation-delay: 0.2s; }
.tile:nth-child(3) { animation-delay: 0.4s; }
.tile:nth-child(4) { animation-delay: 0.6s; }
.tile:nth-child(5) { animation-delay: 0.8s; }

.tile img {
  width: 90%;
  height: 90%;
  object-fit: contain;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.splash-title {
  font-size: 3.5rem;
  font-weight: bold;
  margin: 1rem 0;
  color: #FFD700;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.8),
               0 0 40px rgba(255, 215, 0, 0.6);
  animation: glow 2s ease-in-out infinite;
}

@keyframes glow {
  0%, 100% { text-shadow: 0 0 20px rgba(255, 215, 0, 0.8); }
  50% { text-shadow: 0 0 40px rgba(255, 215, 0, 1); }
}

.splash-subtitle {
  font-size: 1.5rem;
  font-weight: 600;
  color: #FFF;
  margin-bottom: 0.5rem;
}

.splash-tagline {
  font-size: 1rem;
  color: #FFD700;
  margin-bottom: 2rem;
}

.start-button {
  background: linear-gradient(145deg, #FFD700, #FFA500);
  color: #000;
  font-size: 1.5rem;
  font-weight: bold;
  padding: 1rem 3rem;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(255, 215, 0, 0.5);
  transition: all 0.3s ease;
}

.start-button:hover {
  transform: scale(1.05);
  box-shadow: 0 12px 30px rgba(255, 215, 0, 0.7);
}

.start-button:active {
  transform: scale(0.98);
}

.splash-footer {
  margin-top: 3rem;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
}

.certs {
  margin-bottom: 0.5rem;
}

@media (max-width: 600px) {
  .splash-title {
    font-size: 2.5rem;
  }

  .tile {
    width: 50px;
    height: 65px;
  }
}
</style>
