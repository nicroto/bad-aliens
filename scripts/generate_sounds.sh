#!/bin/bash

# Create sounds directory if it doesn't exist
mkdir -p public/assets/sounds

# Player weapon sounds
# Laser 1 - Single shot (high-pitched beep)
ffmpeg -f lavfi -i "sine=frequency=880:duration=0.2" -af "volume=0.5" public/assets/sounds/player-laser-1.mp3

# Laser 2 - Double shot (two quick beeps)
ffmpeg -f lavfi -i "sine=frequency=980:duration=0.3" -af "volume=0.5,tremolo=f=10:d=0.8" public/assets/sounds/player-laser-2.mp3

# Laser 3 - Triple shot (three quick beeps with echo)
ffmpeg -f lavfi -i "sine=frequency=1080:duration=0.4" -af "volume=0.5,tremolo=f=15:d=0.8,aecho=0.8:0.5:40:0.5" public/assets/sounds/player-laser-3.mp3

# Enemy weapon sounds
# Energy ball - low frequency pulsing sound
ffmpeg -f lavfi -i "sine=frequency=220:duration=0.5" -af "volume=0.4,tremolo=f=5:d=0.7" public/assets/sounds/enemy-energy-1.mp3

# Plasma bolt - high frequency buzzing sound
ffmpeg -f lavfi -i "sine=frequency=440:duration=0.4" -af "volume=0.4,tremolo=f=20:d=0.9" public/assets/sounds/enemy-plasma-2.mp3

# Fire orb - crackling sound
ffmpeg -f lavfi -i "anoisesrc=duration=0.4:color=pink" -af "volume=0.4,lowpass=f=1000,highpass=f=200" public/assets/sounds/enemy-fire-3.mp3

# Lightning bolt - electric zap sound
ffmpeg -f lavfi -i "sine=frequency=880:duration=0.3" -af "volume=0.4,tremolo=f=30:d=0.95,aecho=0.8:0.5:20:0.5" public/assets/sounds/enemy-lightning-4.mp3

# Explosion sound - low boom with echo
ffmpeg -f lavfi -i "sine=frequency=100:duration=0.6" -af "volume=0.6,tremolo=f=8:d=0.8,aecho=0.8:0.5:60:0.7" public/assets/sounds/explosion.mp3

# Extra life - Ascending tones with positive feel
ffmpeg -f lavfi -i "sine=frequency=523.25:duration=0.2" -af "volume=0.7" public/assets/sounds/extra-life-1.mp3
ffmpeg -f lavfi -i "sine=frequency=659.26:duration=0.2" -af "volume=0.7" public/assets/sounds/extra-life-2.mp3
ffmpeg -f lavfi -i "sine=frequency=783.99:duration=0.3" -af "volume=0.7" public/assets/sounds/extra-life-3.mp3

# Combine the extra life sounds with a small delay between them
ffmpeg -i public/assets/sounds/extra-life-1.mp3 -i public/assets/sounds/extra-life-2.mp3 -i public/assets/sounds/extra-life-3.mp3 -filter_complex "[0:a][1:a]concat=n=2:v=0:a=1[temp];[temp][2:a]concat=n=2:v=0:a=1[out]" -map "[out]" public/assets/sounds/extra-life.mp3

# Remove the temporary files
rm public/assets/sounds/extra-life-1.mp3 public/assets/sounds/extra-life-2.mp3 public/assets/sounds/extra-life-3.mp3

echo "Sound generation complete!" 