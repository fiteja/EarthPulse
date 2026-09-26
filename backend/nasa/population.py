# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    population.py                                      :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: imuondo <imuondo@student.42.fr>            +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2026/09/22 15:08:26 by imuondo           #+#    #+#              #
#    Updated: 2026/09/26 20:20:51 by imuondo          ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

import requests
import rasterio
from rasterio.transform import from_origin
import json

# TOKEN = "eyJ0eXAiOiJKV1QiLCJvcmlnaW4iOiJFYXJ0aGRhdGEgTG9naW4iLCJzaWciOiJlZGxqd3RwdWJrZXlfb3BzIiwiYWxnIjoiUlMyNTYifQ.eyJ0eXBlIjoiVXNlciIsInVpZCI6ImltdW9uZG8iLCJleHAiOjE3OTUyNjk0OTcsImlhdCI6MTc5MDA4NTQ5NywiaXNzIjoiaHR0cHM6Ly91cnMuZWFydGhkYXRhLm5hc2EuZ292IiwiaWRlbnRpdHlfcHJvdmlkZXIiOiJlZGxfb3BzIiwiYWNyIjoiZWRsIiwiYXNzdXJhbmNlX2xldmVsIjozfQ.gEqHrdMVBvWKirvhSy7ljnGXp-5iqcDoA2-RgQ8a9v34nlKzXFQDaJnU-Str-0CSOZcvzgGE4LlqL1-QpRLCIvD5sjmquGuZkH6VvoS332-SGPrlo-6mIUC95rWOAzVEmD6rJPEslVrn88rnimckm3ugPWoSawi4GLzOitlbfvlgZ81FyWmlDZ6JDSLH60E0zcao4vDFasLuo2r3QbuDJvc5npfZMCLLK3bzy9mhd1aB20Bk7vxMwkoQjVjerutBSCyMWaltFJyBKv7V51esd_t8F1uLrwG8M_0ajZkCM69Uakpupfsw8YJr1QdO_i5FPwyWBSxqAPw-DnSpmXDv6g"

url = "https://cmr.earthdata.nasa.gov/search/collections"

headers = {
	"Authorization": f"Bearer {TOKEN}",
    "Accept": "application/json",
    "Client-Id": "imuondo"
}

params = {
    "keyword": "population",
    "page_size": 100,
	 "bounding_box[]": "11.6,-18.1,24.1,-4.3"
}

response = requests.get(url, headers=headers, params=params)

if (response.ok):
	print("Succefull request")
	data = response.json()
	print("Data: ")
	for collection in data["feed"]["entry"]:
		print("=== POPULATION DATASET 1 KM ===")
		print("Name:", collection.get("title"))
		print("Short name:", collection.get("short_name"))
		print("ID:", collection.get("id"))
		print("Time:", collection.get("time_start"), "→", collection.get("time_end"))
		print("Coverage:", collection.get("boxes"))
		print("Resuming:", collection.get("summary"))
else:
	print(f"Error: {response.status_code}")
