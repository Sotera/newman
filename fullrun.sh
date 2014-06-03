unzip sw_emails.zip
python format.py
python louvain.py

# Run louvain process with louvain.csv
# Get output, run louvain_to_gephi.py, copy louvain_to_gephi directory to same directory as better.csv

#python mapips.py
#python ipdatajoin.py

#python google_earth.py
#python ge2.py
#python attachments.py

python email_detector2.py kmrindfleisch@gmail.com > rankings

python nodevals.py

# copy scottwalker1 and scottwalker2 dirs to demail/emails directory
# copy output.csv and node_vals.csv to demail directory

# demail directory can be dragged and dropped into tangelo web directory.  Can be hit via web at <tangelo_path>/demail

