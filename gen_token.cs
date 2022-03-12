// https://github.com/robinhood-unofficial/pyrh/issues/176#issuecomment-487310801

using System;
using System.Collections.Generic;

public class Program
{
		public static string GenerateDeviceToken()
{
    List<int> rands = new List<int>();
    var rng = new Random();
    for (int i = 0; i < 16; i++)
    {
        var r = rng.NextDouble();
        double rand = 4294967296.0 * r;
        rands.Add(((int)((uint)rand >> ((3 & i) << 3))) & 255);
    }

    List<string> hex = new List<string>();
    for (int i = 0; i < 256; ++i)
    {
        hex.Add(Convert.ToString(i + 256, 16).Substring(1));
    }

    string id = "";
    for (int i = 0; i < 16; i++)
    {
        id += hex[rands[i]];

        if (i == 3 || i == 5 || i == 7 || i == 9)
        {
            id += "-";
        }
    }

    return id;
}

	public static void Main()
	{
		Console.WriteLine("Hello World");
		Console.WriteLine(GenerateDeviceToken());
	}

}