import json
import os
from datetime import datetime, timedelta
import boto3
from aws_lambda_event import SQSEvent
from boto3.dynamodb.types import TypeSerializer, TypeDeserializer
from fake_useragent import UserAgent
from selenium import webdriver
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement

serializer = TypeSerializer()
deserializer = TypeDeserializer()


def find_price(browser: webdriver.Chrome, xpath: str) -> float:
    browser.implicitly_wait(15)
    price_element: WebElement = browser.find_element(By.XPATH, xpath)
    price_extract = price_element.text
    # strip extra characters and parse text to number
    price_text = ""
    for c in price_extract:
        if c.isdigit() or c == '.':
            price_text += c
        if len(price_text.split(".")[1]):
            break
    return float(price_text)


def create_chrome_options(ua_str: str) -> ChromeOptions:
    chrome_options = ChromeOptions()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--disable-dev-tools")
    chrome_options.add_argument("--no-zygote")
    chrome_options.add_argument("--single-process")
    chrome_options.add_argument("window-size=2560x1440")
    chrome_options.add_argument("--user-data-dir=/tmp/chromium")
    chrome_options.add_argument("--remote-debugging-port=9222")
    chrome_options.binary_location = '/opt/chromium/chrome'
    return chrome_options


def create_browser(chrome_options: ChromeOptions) -> webdriver.Chrome:
    browser = webdriver.Chrome(
        executable_path='/opt/chromedriver/chromedriver',
        options=chrome_options,
        service_log_path='/tmp/chromedriver.log'
    )
    return browser


def generate_user_agent() -> str:
    ua = UserAgent(browsers=["chrome", "edge", "firefox"])
    ua.load()
    return ua.random


def save_price(ddb, product_url_id: str, price: float):
    price_timestamp = datetime.now().timestamp()
    now = datetime.now() + timedelta.days(30)
    ddb.put_item(
        TableName=os.getenv("PRICES_TABLE_NAME"),
        Item={
            "price": TypeSerializer.serialize(price),
            "pk": TypeSerializer.serialize(product_url_id),
            "sk": TypeSerializer.serialize(int(price_timestamp)),
            "expirationTimestamp": TypeSerializer.serialize(int(now.timestamp()))
        }
    )
    return


def lambda_handler(event: dict, context):
    ua_str = generate_user_agent()
    chrome_options = create_chrome_options(ua_str)
    browser = create_browser(chrome_options)
    ddb = boto3.client("dynamodb", region_name=os.getenv("AWS_REGION"))
    for record in event["Records"]:
        event_body = json.loads(record["body"])
        product_url = event_body["productUrl"]
        product_url_id = event_body["productUrlId"]
        xpath = event_body["xpath"]
        browser.get(product_url)
        price = find_price(browser, xpath)
        save_price(ddb, product_url_id, price)
    ddb.close()
    browser.close()
    return



