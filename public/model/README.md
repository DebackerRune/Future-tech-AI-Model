# Model

Zet hier de export van Teachable Machine (**Model exporteren → Tensorflow.js → Download**):

- `model.json`
- `metadata.json`
- `weights.bin`

De app leest de klassen uit `metadata.json`. Een klasse met een getal in de naam (`20 euro`) is een biljet;
een klasse zonder getal (`geen biljet`) betekent "geen biljet". Je kan dus later klassen toevoegen (bv. `100 euro`)
zonder de code aan te passen.
