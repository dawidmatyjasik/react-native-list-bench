import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

type Option<T extends string | number> = {
  value: T;
  label: string;
};

type OptionGroupProps<T extends string | number> = {
  title: string;
  testIdPrefix: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

export const OptionGroup = <T extends string | number>({
  title,
  testIdPrefix,
  options,
  value,
  onChange,
}: OptionGroupProps<T>) => (
  <View style={styles.group}>
    <Text style={styles.title}>{title}</Text>
    <View style={styles.options}>
      {options.map(option => {
        const isSelected = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            testID={`${testIdPrefix}-${option.value}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onChange(option.value)}
            style={[styles.option, isSelected && styles.optionSelected]}
          >
            <Text style={[styles.label, isSelected && styles.labelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  </View>
);

const styles = StyleSheet.create({
  group: {
    gap: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.navy60,
  },
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: colors.navy,
  },
  optionSelected: {
    backgroundColor: colors.navy,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.navy,
  },
  labelSelected: {
    color: colors.white,
  },
});
