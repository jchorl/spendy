import datetime
import os.path
import pickle

from flask import Flask, jsonify, request
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request

# If modifying these scopes, delete the file token.pickle.
SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

FINANCE_SPREADSHEET_ID = "1yiHbSLDIIYPZPJrgfSnpJZKelaQ3CFVE9bFPs77MMAI"


# If `entrypoint` is not defined in app.yaml, App Engine will look for an app
# called `app` in `main.py`.
app = Flask(__name__)


def get_google_creds():
    creds = None
    # The file token.pickle stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first
    # time.
    if os.path.exists("token.pickle"):
        with open("token.pickle", "rb") as token:
            creds = pickle.load(token)

    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
            creds = flow.run_console()
        # Save the credentials for the next run
        # commented out because app engine has read-only fs
        # with open("token.pickle", "wb") as token:
        #     pickle.dump(creds, token)

    return creds


def deserialize_sheets(accounts, value_ranges, days=30):
    all_transactions = []
    for idx in range(len(accounts)):
        values = value_ranges[idx]["values"]
        headings = values[0]
        date_idx = headings.index("Date")
        amount_idx = headings.index("Effective Amount")
        category_idx = headings.index("Effective Category")
        ack_idx = headings.index("Ack")

        # ignore the first row, it's just labels
        values = values[1:]

        # only use ack'd transactions
        values = list(filter(lambda v: v[ack_idx] == "Yes", values))

        transactions = [
            {
                "account": accounts[idx],
                "date": datetime.datetime.strptime(value[date_idx], "%Y-%m-%d"),
                "amount": value[amount_idx],
                "category": value[category_idx],
            }
            for value in values
        ]

        # filter out dates before days ago
        transactions = list(
            filter(
                lambda t: t["date"]
                > datetime.datetime.now() - datetime.timedelta(days=days),
                transactions,
            )
        )

        all_transactions += transactions
    return all_transactions


@app.route("/api/charges")
def get_charges():
    num_days = int(request.args.get("days", 30))
    creds = get_google_creds()
    service = build("sheets", "v4", credentials=creds, cache_discovery=False)
    spreadsheet = (
        service.spreadsheets().get(spreadsheetId=FINANCE_SPREADSHEET_ID).execute()
    )
    titles = [sheet["properties"]["title"] for sheet in spreadsheet["sheets"]]
    titles = list(filter(lambda t: t not in ["Template", "Categories"], titles))

    resp = (
        service.spreadsheets()
        .values()
        .batchGet(spreadsheetId=FINANCE_SPREADSHEET_ID, ranges=titles)
        .execute()
    )
    all_transactions = deserialize_sheets(titles, resp["valueRanges"], days=num_days)
    return jsonify(all_transactions)


if __name__ == "__main__":
    # This is used when running locally only. When deploying to Google App
    # Engine, a webserver process such as Gunicorn will serve the app. This
    # can be configured by adding an `entrypoint` to app.yaml.
    app.run(host="0.0.0.0", port=8080, debug=True)
