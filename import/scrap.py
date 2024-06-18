import json
import time
from undetected_chromedriver import Chrome, ChromeOptions
from selenium.webdriver.common.by import By
from selenium.webdriver.support.select import Select
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
from unidecode import unidecode
from selenium.common.exceptions import StaleElementReferenceException
import re
import os
import ssl
import certifi

def normalize_unicode(text):
    return unidecode(text)

def scrape_vulbis_page(type):
    # Add the driver options
    options = ChromeOptions()
    options.headless = False

    # Create an SSL context using certifi
    context = ssl.create_default_context(cafile=certifi.where())

    # Patch undetected_chromedriver to use the created SSL context
    original_init = Chrome.__init__

    def patched_init(self, *args, **kwargs):
        self.ssl_context = context
        original_init(self, *args, **kwargs)

    Chrome.__init__ = patched_init

    # Configure the undetected_chromedriver options
    driver = Chrome(options=options, version_main=125)  # Spécifiez la version de Chrome

    # Define the URL based on the type
    urls = {
        "gears": "https://www.vulbis.com/?server=Draconiros&gids=&percent=0&craftableonly=false&select-type=1000000&sellchoice=false&buyqty=1&sellqty=1&percentsell=0",
        "resources": "https://www.vulbis.com/?server=Draconiros&gids=&percent=0&craftableonly=false&select-type=1000002&sellchoice=false&buyqty=1&sellqty=1&percentsell=0",
        "consumables": "https://www.vulbis.com/?server=Draconiros&gids=&percent=0&craftableonly=false&select-type=1000001&sellchoice=false&buyqty=1&sellqty=1&percentsell=0"
    }

    driver.execute_script(f'''window.open("{urls[type]}","_blank");''')  # open page in new tab
    time.sleep(5)  # wait until page has loaded
    driver.switch_to.window(window_name=driver.window_handles[0])  # switch to first tab
    driver.close()  # close first tab
    driver.switch_to.window(window_name=driver.window_handles[0])  # switch back to new tab
    time.sleep(5)  # wait until page has loaded

    # Select the "ALL" option in the dropdown
    try:
        WebDriverWait(driver, 15).until(EC.element_to_be_clickable((By.NAME, 'scanTable_length')))
        select_element = driver.find_element(By.NAME, 'scanTable_length')
        select = Select(select_element)
        select.select_by_visible_text('All')
    except StaleElementReferenceException:
        time.sleep(3)
        select_element = driver.find_element(By.NAME, 'scanTable_length')
        select = Select(select_element)
        select.select_by_visible_text('All')

    # Wait for the page to be fully loaded after selecting the option
    WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, 'tr')))

    # Get the page content after JavaScript rendering
    page_source = driver.page_source

    # Use BeautifulSoup to parse the HTML
    soup = BeautifulSoup(page_source, 'html.parser')

    # Find the table rows containing the data
    table_rows = soup.find_all('tr')

    data = []
    for row in table_rows:
        cells = row.find_all('td')
        if len(cells) > 1:  # Check if there are at least two cells in the row
            item_name_elem = cells[1].find('p')
            if item_name_elem:
                item_name = normalize_unicode(item_name_elem.text.strip()).replace('\u2006', '')
                onclick_attr = item_name_elem.get('onclick')
                if onclick_attr:
                    id_item = re.search(r"search\(.*?,\s*'(\d+)',", onclick_attr).group(1)
                else:
                    id_item = None
                lot_1_elem = cells[5].find('p')
                lot_10_elem = cells[6].find('p')
                lot_100_elem = cells[7].find('p')
                if lot_1_elem and lot_10_elem and lot_100_elem:
                    lot_1 = normalize_unicode(lot_1_elem.text.strip()).replace('\u2006', '')
                    lot_10 = normalize_unicode(lot_10_elem.text.strip()).replace('\u2006', '')
                    lot_100 = normalize_unicode(lot_100_elem.text.strip()).replace('\u2006', '')

                    item_data = {
                        "item_name": item_name,
                        "id_item": id_item,
                        "lot_1": lot_1,
                        "lot_10": lot_10,
                        "lot_100": lot_100,
                    }
                    data.append(item_data)

    driver.quit()
    return data

def export_to_json(data, filename):
    file_path = os.path.join('./import', filename)  # Chemin complet du fichier dans le répertoire './import'
    with open(file_path, 'w') as json_file:
        json.dump(data, json_file, indent=4)

def main():
    types = ["gears", "resources", "consumables"]
    filenames = ["gears_data.json", "resources_data.json", "consumables_data.json"]

    for type, filename in zip(types, filenames):
        vulbis_data = scrape_vulbis_page(type)
        if vulbis_data:
            if os.path.exists(filename):
                os.remove(filename)  # Supprimer le fichier existant
            export_to_json(vulbis_data, filename)

if __name__ == "__main__":
    main()
