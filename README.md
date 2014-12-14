gandi-dyndns
============

If you have a computer with a dynamic ip address, and host a domain at Gandi's, you can use this small script
to update a specific dns entry with your public ip address (not unlike no-ip, dyndns, and other services).

Configuration
=============

Install the script with "npm install", and add a gandi-dns-config.json either in your home folder, or in the
current directory.

The configuration file has the following form:

  [
    {
      "api-key": "XXXXXXXX",
      "record": "my.record.domain.tld"
    }
  ]

See the provided sample in the project folder.

Running it
==========

You must have nodejs installed:

nodejs .

or

nodejs index

How it works
============

For each entry in the configuration file, the script does the following:

- It gets the public IP of the computer it runs on, using the http://icanhazip.com service
- It checks if the record exists in the DNS entry
- If the record does not exist, or if it exists but is different from the public IP, then it updates
the DNS record

