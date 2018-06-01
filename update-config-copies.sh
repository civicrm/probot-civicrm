#!/bin/bash

## Copy the the civicrm-core config to other repos
CONFIG=config

if [ ! -d "${CONFIG}/civicrm/civicrm-core" ]; then
  echo "To run this script, first 'cd' into the probot app root."
  exit 1
fi

for REPO in civicrm/civicrm-backdrop civicrm/civicrm-drupal civicrm/civicrm-packages totten/githubtest ; do
  echo "Copy ${CONFIG}/civicrm-core/* to $CONFIG/$REPO/"
  cp -r "${CONFIG}"/civicrm/civicrm-core/* "${CONFIG}/${REPO}/"
done
