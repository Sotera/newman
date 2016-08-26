#!/bin/bash
# "shiavo" is the index name for the sample data that came with the 
# newman-vm-v2.0.9.box 11 gigabyte download.
#
# The necessary field "original_artifact.filename" has not been added
# at this time, so this should basically run but spew a ton of warnings
# to stderr
python addInternalAttachmentIds.py newman-shiavo shiavo_att_crossref.csv
