Arduino-Controlled Tetris Game
This project is a replica of the classic Tetris game built using HTML, CSS, JavaScript, and the Arduino IDE (C++), with added support for a physical joystick controller. High scores are calculated and tracked within the game, creating a fun and competitive experience.

🕹️ Controller Setup (Arduino + Joystick)
The game can be controlled using either a keyboard or a joystick connected to an Arduino. The joystick acts as a real-world game controller and connects using the following pin configuration:

VRx → A0

VRy → A1

SW (Button) → Digital Pin 2

GND → GND

VCC (Power) → 5V

Once the Arduino sketch is uploaded, the joystick inputs are sent via serial communication to the game, allowing smooth directional control and button-based actions.

🧠 Features
Tetris gameplay logic with falling tetrominoes

High score tracking system

Dual input modes:

Physical joystick (Arduino)

Standard keyboard

⌨️ Controls
Using Joystick:

Move Left/Right: Tilt joystick horizontally

Rotate Block: Tilt joystick upward

Drop Block: Press joystick button (SW)

Using Keyboard:

A → Move Left

D → Move Right

W → Rotate

S → Soft Drop

Space → Instant Drop

🛠️ Technologies Used
HTML/CSS – Interface and layout

JavaScript – Game logic and rendering

Arduino (C++) – Reading joystick input and sending serial data

When connecting the game to the Joystick, ensure that you upload the code to Arduino and update the port in the game code files to port X, which is the port you have set. Make sure no other program is reading the serial monitor before connecting the joystick to the game.

Below this is the C++ code needed to run for the Joystick controller: 
const int VRx = A0;
const int VRy = A1;
const int SW = 2;

unsigned long lastSend = 0;
const int debounceTime = 150;

void setup() {
  pinMode(SW, INPUT_PULLUP);
  Serial.begin(9600);
}

void loop() {
  int x = analogRead(VRx);
  int y = analogRead(VRy);
  bool btn = digitalRead(SW) == LOW;

  String command = "";

  // Deadzone between 450 and 550
  if (x < 400) command = "LEFT";
  else if (x > 600) command = "RIGHT";
  else if (y > 600) command = "DOWN";
  else if (y < 400) command = "ROTATE";
  else if (btn) command = "DROP";

  // Only send if it's a valid command and debounce passed
  if (command != "" && millis() - lastSend > debounceTime) {
    Serial.println(command);
    lastSend = millis();
  }

  delay(10); // Smooth loop
}


