# Motivation

Adquiring data from meter readings and current consuptions at the moment from an electricity meter.

# UFD - Union Fenosa Distribucion

In Spain every electricity client has been assigned to a distribution company depending on the area, in this case **Union Fenosa Distribucion".

The smart meter sends data periodically about the readings in order to know the electricity being consumed and that data is stored in order to calculate the client's bill.

Client's can access to this data through the next page:

https://areaprivada.ufd.es/login

# Data adquisition automation

This project automates data adquisition with **nodejs + puppeteer** and is storing results on "output" folder as:

- meter_readings.json -> meter's readings at this moment.
- consumptions.json ->  meter's historic consumptions.

# Run

Running : 

```bash
node main.js --user $UFD_USER --pass $UFD_PASS
```

Output :

```bash
user: 12345678X
pass: ****
wait: 15000 ms (default)
===============
Results: 
Saved results as  output/consumptions.json
Saved results as  output/meter_readings.json
```

Username and password must be provided.

The "wait" parameter (--wait 20000) is optional and can be used to wait for a greater amount of time before closing the browser (puppeteer) for interaction between the nodejs app and the browser.
