# sfcc

This is a command line tool to ease development on Salesforce Commerce Cloud (SFCC), an e-commerce framework.
It's a work-in-progress, and currently supports:

* importing your cartridges from an instance
* watch and sync local changes to a sandbox instance

You can use **ES6 syntax**, such as arrow functions, as your code will be transpiled to ES5 by Babel.
You can also change **SASS files**, as this tool will compile them using node-sass and then sync the
resulting CSS files.

If you want specific features, drop me an email at [johan@johanli.com](mailto:johan@johanli.com).

## Setup

### For sandbox instances

```
npm install sfcc -g
```

Create a `.env` file in the root directory of your project, containing the following variables:

```
SFCC_DOMAIN=sandbox-web-customer.demandware.net
SFCC_USERNAME=username
SFCC_PASSWORD=password
```

The username and password of a business manager account with the Administrator role (with WebDAV permissions) needs to be used.

### For staging

If you are deploying to staging, you also need to generate a .p12 file. This is outlined in the "Using Two-Factor Authentication
for Code Deployment" section in the Salesforce Commerce Cloud documentation. Place the .p12 file in the root directory,
and add the following variables:

```
SFCC_CERTIFICATE=certificate.p12
SFCC_CERTIFICATE_PASSPHRASE=passphrase
```

Don't forget to update `SFCC_DOMAIN` as well, which should be a URL of the form cert.staging.web.customer.demandware.net.

`SFCC_CERTIFICATE_PASSPHRASE` is optional and can be left out.

## Commands

* **sfcc import**
* **sfcc import &lt;codeVersion&gt;**
* **sfcc watch**
* **sfcc watch &lt;codeVersion&gt;**

## Issues

You need to prepend a _ to the filename of all .scss files inside **cartridges/sfcc_core/cartridge/scss/default/lib/flag-icon-css**.