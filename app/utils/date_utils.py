import dateutil.parser 
import dateutil.tz
import datetime


def timeNow():
    return datetime.datetime.now().strftime('%H:%M:%S')


def dateToUTCstr(str_date):
    # this fails to parse timezones out of formats like
    # Tue, 17 Jun 2010 08:33:51 EDT
    # so it will assume the local timezone for those cases
    dt = dateutil.parser.parse(str_date)
    if not dt.tzinfo:
        dt = dt.replace(tzinfo=dateutil.tz.tzlocal())
    dt_tz = dt.astimezone(dateutil.tz.tzutc())
    return dt_tz.strftime('%Y-%m-%dT%H:%M:%S')


def fmtNow():
    return datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')
