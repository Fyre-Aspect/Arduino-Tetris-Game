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